import type { AxiosInstance, AxiosRequestConfig } from 'axios'
import axios from 'axios'
import Cookies from 'js-cookie'
import storage from 'store2'
import qs from 'qs'
import merge from 'lodash/merge'
import cloneDeep from 'lodash/cloneDeep'
import toNumber from 'lodash/toNumber'
import clone from 'lodash/clone'
import toString from 'lodash/toString'
import isEmpty from 'lodash/isEmpty'
import omit from 'lodash/omit'
import { IS_AUTH, REFRESH_TOKEN, TOKEN, LAST_REFRESH_TOKEN_TIMESTAMP } from '../constants/store'
import { setCookies } from './cookie'
import { AppConfig } from '../config'

const DEFAULT_TIMEOUT = 1000 * 30

declare module 'axios' {
  export interface AxiosRequestConfig {
    ignoreError?: boolean
  }
}

const getToken = () => {
  return storage.get(TOKEN)
}

const getRefreshToken = () => {
  return storage.get(REFRESH_TOKEN)
}

class RefreshToken {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static instance: any

  static create() {
    if (!this.instance) {
      this.instance = this.fetchToken()
    }

    return this.instance
  }

  private static async fetchToken() {
    return createInstance({
      baseURL: `${AppConfig.baseApiURL}/`,
    })
      .post(
        'token/refresh/',
        {
          refreshToken: getRefreshToken(),
        },
        {
          ignoreError: true,
        }
      )
      .then((res) => {
        if (res?.data) {
          setCookies(res.data.extra.token, res.data.extra.refreshToken)
        }

        this.instance = null
      })
  }

  static dailyRefresh() {
    if (Cookies.get(IS_AUTH) !== 'true' || !Cookies.get(TOKEN) || !Cookies.get(REFRESH_TOKEN)) {
      return false
    }

    const currentTime = Date.now()
    const lastRefreshTimestamp = toNumber(Cookies.get(LAST_REFRESH_TOKEN_TIMESTAMP) || 0)
    if (currentTime - lastRefreshTimestamp > 24 * 60 * 60 * 1000) {
      Cookies.set(LAST_REFRESH_TOKEN_TIMESTAMP, toString(currentTime))
      this.fetchToken()
    }
  }
}

export function createInstance(config: AxiosRequestConfig): AxiosInstance {
  let instance: AxiosInstance | null = null
  let initializationPromise: Promise<void> | null = null

  const getInitializedInstance = async (): Promise<AxiosInstance> => {
    if (instance) return instance

    if (!initializationPromise) {
      initializationPromise = (async () => {
        const mergeConfig = merge(
          {},
          {
            baseURL: AppConfig.baseApiURL,
            timeout: DEFAULT_TIMEOUT,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            paramsSerializer: function (params: any) {
              return qs.stringify(params, { arrayFormat: 'repeat' })
            },
          },
          config
        )

        instance = axios.create(mergeConfig)
        instance.interceptors.request.use(
          (config) => {
            RefreshToken.dailyRefresh()

            config.params = { ...config.params }

            if (config.headers) {
              config.headers.Authorization = getToken()
              config.headers.Locale = 'en-US'
            }

            return config
          },
          (error) => {
            return Promise.reject(error)
          }
        )

        instance.interceptors.response.use(
          (res) => res)
      })()
    }

    await initializationPromise
    return instance!
  }

  return new Proxy({} as AxiosInstance, {
    get: (_, prop) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return async (...args: any[]) => {
        const initializedInstance = await getInitializedInstance()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (initializedInstance as any)[prop](...args)
      }
    },
  })
}

const methods = ['post', 'put', 'delete', 'get', 'patch'] as const
type Method = (typeof methods)[number]

export class APIService {
  fetch: AxiosInstance
  requestId: string | null = null
  customHeaders: Record<string, string> = {}

  constructor(fetch: AxiosInstance) {
    this.fetch = omit(fetch, methods) as unknown as AxiosInstance

    methods.forEach((method) => {
      // @ts-ignore
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.fetch[method as Method] = async (url: string, data?: any = {}, config?: AxiosRequestConfig) => {
        const customHeaders = this.getCustomHeaders()
        const requestData = cloneDeep(data)

        // https://stackoverflow.com/questions/51069552/axios-delete-request-with-body-and-headers
        if (['delete', 'get'].includes(method) && !isEmpty(customHeaders)) {
          Object.assign(requestData, {
            headers: customHeaders,
          })
        }

        const res = await fetch[method](
          url,
          requestData,
          merge(
            {},
            config,
            !isEmpty(customHeaders)
              ? {
                  headers: customHeaders,
                }
              : {}
          )
        )

        return res
      }
    })
  }

  getCustomHeaders(): Record<string, string> {
    return clone(this.customHeaders)
  }
}
