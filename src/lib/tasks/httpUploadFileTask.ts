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

  protected getMethod(): Method {
    return 'patch'
  }

  // eslint-disable-next-line @typescript-eslint/require-await, @typescript-eslint/no-explicit-any
  protected async getData(): Promise<any> {
    const path = this.getFilePath()
    const logger = this.logger

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const p = new Promise<any>(function (resolve) {
      const data = new FormData()
      logger.info(`Upload file ${path}`)
      const fileStream = fs.createReadStream(path)
      const chunks: BinaryLike[] = []
      fileStream.on('data', function (chunk) {
        chunks.push(chunk)
      })

      fileStream.on('end', function () {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        data.append('file', new Blob(chunks), 'file.mp3')
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

    return metadata
  }
}
