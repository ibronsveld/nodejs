/* @flow */
import fetch from 'node-fetch'
import { createClient } from '@commercetools/sdk-client'
import { createRequestBuilder, features } from '@commercetools/api-request-builder'
import { createHttpMiddleware } from '@commercetools/sdk-middleware-http'
import {
  createAuthMiddlewareForClientCredentialsFlow,
  createAuthMiddlewareWithExistingToken,
} from '@commercetools/sdk-middleware-auth'
import { createUserAgentMiddleware } from '@commercetools/sdk-middleware-user-agent'
import JSONStream from 'JSONStream'
import type {
  ApiConfigOptions,
  ExporterOptions,
  LoggerOptions,
} from 'types/orders'
import type { Client, ClientRequest } from 'types/sdk'
import silentLogger from './utils/silent-logger'
import pkg from '../package.json'

export default class OrderExporter {
  // Set type annotations
  apiConfig: ApiConfigOptions
  client: Client
  logger: LoggerOptions
  predicate: ?string
  store: ?string

  constructor(options: ExporterOptions) {
    if (!options.apiConfig)
      throw new Error('The constructor must be passed an `apiConfig` object')
    this.apiConfig = options.apiConfig
    this.client = createClient({
      middlewares: [
        createAuthMiddlewareWithExistingToken(
          options.accessToken ? `Bearer ${options.accessToken}` : ''
        ),
        createAuthMiddlewareForClientCredentialsFlow({
          ...this.apiConfig,
          fetch,
        }),
        createUserAgentMiddleware({
          libraryName: pkg.name,
          libraryVersion: pkg.version,
        }),
        createHttpMiddleware({
          host: this.apiConfig.apiUrl,
          enableRetry: true,
          fetch,
        }),
      ],
    })

    this.predicate = options.predicate
    
    this.store = options.store

    this.logger = {
      ...silentLogger,
      ...options.logger,
    }
  }

  run(outputStream: stream$Writable) {
    this.logger.info('Starting Export')
    const jsonStream = JSONStream.stringify()
    jsonStream.pipe(outputStream)
    OrderExporter.handleOutput(
      outputStream,
      jsonStream,
      this.client,
      this.apiConfig.projectKey,
      this.predicate,
      this.store,
      this.logger
    )
  }

  static handleOutput(
    outputStream: stream$Writable,
    pipeStream: stream$Writable,
    client: Object,
    projectKey: string,
    predicate: ?string,
    store: ?string,
    logger: LoggerOptions
  ) { 
    OrderExporter.fetchObjects(
      pipeStream,
      client,
      projectKey,
      predicate,
      store,
      logger
    )
      .then(() => {
        logger.info('Export operation completed successfully')
        if (outputStream !== process.stdout) pipeStream.end()
      })
      .catch((e: Error) => {
        outputStream.emit('error', e)
      })
  }

  static fetchObjects(
    output: stream$Writable,
    client: Object,
    projectKey: string,
    predicate: ?string,
    store: ?string,
    logger: LoggerOptions
  ): Promise<any> {
    const request = OrderExporter.buildRequest(projectKey, predicate, store)

    return client.process(
      request,
      ({ statusCode, body }: Object): Promise<any> => {
        if (statusCode !== 200)
          return Promise.reject(
            new Error(`Request returned error ${statusCode}`)
          )
        body.results.forEach((object: Buffer) => {
          output.write(object)
        })
        logger.debug(
          `Successfully exported ${body.count} %s`,
          body.count > 1 ? 'orders' : 'order'
        )
        return Promise.resolve()
      },
      {
        accumulate: false,
      }
    )
  }

  static buildRequest(projectKey: string, predicate: ?string, store: ?string): ClientRequest {
    const uri = OrderExporter.buildUri(projectKey, predicate, store)    
    return {
      uri,
      method: 'GET',
    }
  }

  static buildUri(projectKey: string, predicate: ?string,  store: ?string): string {
    const requestBuilder = createRequestBuilder({
      projectKey,
      customServices: {
        storeOrders: {
          type: 'orders',
          endpoint: '/in-store/key=' + store + "/orders",
          features: [features.query, features.queryOne],
        }
      }
    })

    const service = (store ? requestBuilder.storeOrders : requestBuilder.orders)
    
    if (predicate) service.where(predicate)
    return service.build()
  }
}
