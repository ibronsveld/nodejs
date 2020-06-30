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
} from 'types/payments'
import type { Client, ClientRequest } from 'types/sdk'
import silentLogger from './utils/silent-logger'
import pkg from '../package.json'

export default class PaymentsExporter {
  // Set type annotations
  apiConfig: ApiConfigOptions
  client: Client
  logger: LoggerOptions
  predicate: ?string
  expand: Array<string>

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
    this.expand = options.expand    

    this.logger = {
      ...silentLogger,
      ...options.logger,
    }
  }

  run(outputStream: stream$Writable) {
    this.logger.info('Starting Export')
    const jsonStream = JSONStream.stringify()
    jsonStream.pipe(outputStream)
    PaymentsExporter.handleOutput(
      outputStream,
      jsonStream,
      this.client,
      this.apiConfig.projectKey,
      this.predicate,
      this.expand,
      this.logger
    )
  }

  static handleOutput(
    outputStream: stream$Writable,
    pipeStream: stream$Writable,
    client: Object,
    projectKey: string,
    predicate: ?string,
    expand: Array<string>,
    logger: LoggerOptions
  ) { 
    PaymentsExporter.fetchObjects(
      pipeStream,
      client,
      projectKey,
      predicate,
      expand,
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
    expand: Array<string>,
    logger: LoggerOptions
  ): Promise<any> {
    const request = PaymentsExporter.buildRequest(projectKey, predicate, expand)

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
          body.count > 1 ? 'payments' : 'payment'
        )
        return Promise.resolve()
      },
      {
        accumulate: false,
      }
    )
  }

  static buildRequest(projectKey: string, predicate: ?string, expand: Array<string>): ClientRequest {
    const uri = PaymentsExporter.buildUri(projectKey, predicate, expand)        
    return {
      uri,
      method: 'GET',
    }
  }

  static buildUri(projectKey: string, predicate: ?string,  expand: Array<string>): string {
    const requestBuilder = createRequestBuilder({
      projectKey    
    })

    const service = requestBuilder.payments
    
    if (predicate) service.where(predicate)

    // Handle `expand` separately because it's an array
    if (expand?.length)    
      expand.forEach((reference: string) => {
      service.expand(reference)
    })  

    return service.build()
  }
}
