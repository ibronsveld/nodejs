/* @flow */
import type {
  Middleware,
  MiddlewareRequest,
  MiddlewareResponse,
  CorrelationIdMiddlewareOptions,
} from '../../../types/sdk'

export default function createCorrelationIdMiddleware(
  options: CorrelationIdMiddlewareOptions
): Middleware {
  return next => (request: MiddlewareRequest, response: MiddlewareResponse) => {
    const nextRequest = {
      ...request,
      headers: {
        ...request.headers,
        'X-Correlation-ID': options.generate(),
      },
    }
    next(nextRequest, response)
  }
}
