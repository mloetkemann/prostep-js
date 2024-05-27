/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { InputMetadata } from '../processRuntime.js'
import { ResponseType, AxiosHeaders, Method } from 'axios'
import fs from 'fs'
import { parseToString } from 'alpha8-lib'
import HttpPostTask from './httpPostTask.js'
import { Blob } from 'buffer'
import { BinaryLike } from 'crypto'

export default class HttpUploadFileTask extends HttpPostTask {
  protected getHeaders(): AxiosHeaders | undefined {
    const headers = super.getHeaders()
    if (headers) headers.set('Content-Type', 'multipart/form-data')
    return headers
  }

  private getFilePath(): string {
    const path = parseToString(this.context?.input.get('path'))
    if (path) return path
    throw new Error('could not find path')
  }

  private getFileName(): string {
    let filename = parseToString(this.context?.input.get('filename'))
    if (!filename) {
      const path = parseToString(this.context?.input.get('path'))
      if (path) filename = path.replace(/^.*[\\/]/, '')
    }

    if (filename) return filename
    throw new Error('could not find filename')
  }

  private appendPayload(data: FormData): FormData {
    const payload = parseToString(this.context?.input.get('payload'))
    if (payload) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const payloadObj = JSON.parse(payload)
      if (payloadObj) {
        // eslint-disable-next-line prefer-const
        for (let key in payloadObj) {
          data.append(key, payloadObj[key])
        }
      }
    }

    return data
  }

  protected getMethod(): Method {
    return 'patch'
  }

  // eslint-disable-next-line @typescript-eslint/require-await, @typescript-eslint/no-explicit-any
  protected async getData(): Promise<any> {
    const path = this.getFilePath()
    const logger = this.logger

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const that = this

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const p = new Promise<any>(function (resolve) {
      let data = new FormData()
      logger.info(`Upload file ${path}`)
      const fileStream = fs.createReadStream(path)
      const chunks: BinaryLike[] = []
      fileStream.on('data', function (chunk) {
        chunks.push(chunk)
      })

      fileStream.on('end', function () {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        data = that.appendPayload(data)
        data.append('file', new Blob(chunks), that.getFileName())
        console.log(data)

        resolve(data)
      })
    })
    return p
  }

  protected getResponseType(): ResponseType | undefined {
    return 'json'
  }

  getInputMetadata(): InputMetadata {
    const metadata = super.getInputMetadata()
    metadata.fields.concat([{ name: 'path', type: 'string', required: true }])
    metadata.fields.concat([
      { name: 'payload', type: 'string', required: false },
    ])
    metadata.fields.concat([
      { name: 'filename', type: 'string', required: true },
    ])

    return metadata
  }
}
