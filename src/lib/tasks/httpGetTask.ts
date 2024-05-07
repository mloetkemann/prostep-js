import { parseToString } from 'alpha8-lib'
import { ExecutableRuntimeContext } from '../base.js'
import { InputMetadata, TaskBase } from '../processRuntime.js'
import axios, {
  AxiosInstance,
  Method,
  AxiosRequestConfig,
  AxiosHeaders,
  ResponseType,
  AxiosResponse,
  AxiosError,
} from 'axios'
import { Step, TaskConfig } from '../processConfig.js'
export default class HttpGetTask extends TaskBase {
  protected axios: AxiosInstance
  protected context?: ExecutableRuntimeContext

  constructor(protected stepConfig: Step, protected taskConfig: TaskConfig) {
    super(stepConfig, taskConfig)

    this.axios = axios.create({
      timeout: 10000,
    })
  }

  protected getUrl(): string {
    const url = parseToString(this.context?.input.get('url'))
    if (url) return url
    throw Error('No Url defined')
  }

  protected getMethod(): Method {
    return 'get'
  }

  protected getHeaders(): AxiosHeaders | undefined {
    const headers = new AxiosHeaders()
    headers.set('Accept', 'application/json')
    const auth_token = parseToString(this.context?.input.get('auth_token'))
    if (auth_token) {
      headers.set('Authorization', `Bearer ${auth_token}`)
    }
    return headers
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected async getData(): Promise<any> {}

  protected getResponseType(): ResponseType | undefined {
    return 'json'
  }

  protected async request(): Promise<AxiosResponse> {
    const url = this.getUrl()
    const config: AxiosRequestConfig = {
      url: url,
      method: this.getMethod(),
      headers: this.getHeaders(),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      data: await this.getData(),
      responseType: this.getResponseType(),
    }
    try {
      const response = await this.axios.request(config)

      return response
    } catch (e) {
      if (e instanceof AxiosError) {
        if (axios.isAxiosError(e)) {
          // Access to config, request, and response
          this.logger.error(`HTTP Error with code ${e.response?.status}`)
          this.logger.error(JSON.stringify(e.response?.data))
        } else {
          // Just a stock error
        }
      }

      throw Error(`Failed request ${url}`)
    }
  }

  getInputMetadata(): InputMetadata {
    return {
      fields: [
        { name: 'url', type: 'string', required: true },
        { name: 'auth_token', type: 'string' },
      ],
    }
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async executeTask(context: ExecutableRuntimeContext) {
    this.context = context
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const result = await this.request()

    await this.processResult(result, context)
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  protected async processResult(
    result: AxiosResponse,
    context: ExecutableRuntimeContext
  ) {
    context.result.set('responseData', result.data)
    context.result.set('responseStatus', result.status)
  }
}
