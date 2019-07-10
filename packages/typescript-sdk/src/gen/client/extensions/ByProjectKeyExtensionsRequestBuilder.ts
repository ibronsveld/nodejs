
import { ByProjectKeyExtensionsKeyByKeyRequestBuilder } from './ByProjectKeyExtensionsKeyByKeyRequestBuilder'
import { ByProjectKeyExtensionsByIDRequestBuilder } from './ByProjectKeyExtensionsByIDRequestBuilder'
import { ExtensionDraft } from './../../models/Extension'
import { ExtensionPagedQueryResponse } from './../../models/Extension'
import { Extension } from './../../models/Extension'
import { Middleware } from './../../base/common-types'
import { ApiRequest } from './../../base/requests-utils'

export class ByProjectKeyExtensionsRequestBuilder {

    
      constructor(
        protected readonly args: {
          pathArgs: {
                projectKey: string
           },
          middlewares: Middleware[];
        }
      ) {}
    
    withKey(
       childPathArgs: {
           key: string
       }
    ): ByProjectKeyExtensionsKeyByKeyRequestBuilder {
       return new ByProjectKeyExtensionsKeyByKeyRequestBuilder(
             {
                pathArgs: {
                   ...this.args.pathArgs,
                   ...childPathArgs
                },
                middlewares: this.args.middlewares
             }
       )
    }
    
    withId(
       childPathArgs: {
           ID: string
       }
    ): ByProjectKeyExtensionsByIDRequestBuilder {
       return new ByProjectKeyExtensionsByIDRequestBuilder(
             {
                pathArgs: {
                   ...this.args.pathArgs,
                   ...childPathArgs
                },
                middlewares: this.args.middlewares
             }
       )
    }
    
    
    get(
        methodArgs?:{
           
           queryArgs?: {
              expand?: string
              where?: string
              sort?: string
              limit?: number
              offset?: number
              withTotal?: boolean
           },
           headers?: {
              [key:string]:string
           },
        }): ApiRequest<ExtensionPagedQueryResponse> {
       return new ApiRequest<ExtensionPagedQueryResponse>(
           {
              baseURL: 'https://api.sphere.io',
              method: 'GET',
              uriTemplate: '/{projectKey}/extensions',
              pathVariables: this.args.pathArgs,
              headers: {
                  ...(methodArgs || {} as any).headers
              },
              queryParams: (methodArgs || {} as any).queryArgs,
           },
           this.args.middlewares
       )
    }
    
    post(
         methodArgs:{
            
            queryArgs?: {
               expand?: string
            },
            body: ExtensionDraft,
            headers?: {
               [key:string]:string
            },
         }): ApiRequest<Extension> {
       return new ApiRequest<Extension>(
           {
              baseURL: 'https://api.sphere.io',
              method: 'POST',
              uriTemplate: '/{projectKey}/extensions',
              pathVariables: this.args.pathArgs,
              headers: {
                  'Content-Type': 'application/json',
                  ...(methodArgs || {} as any).headers
              },
              queryParams: (methodArgs || {} as any).queryArgs,
              body: (methodArgs || {} as any).body,
           },
           this.args.middlewares
       )
    }
    

}
