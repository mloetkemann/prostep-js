/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { ExecutableRuntimeContext } from '../base.js'
import { InputMetadata } from '../processRuntime.js'
import { ResponseType, AxiosResponse, AxiosHeaders } from 'axios'
import HttpGetTask from './httpGetTask.js'
import fs from 'fs'
import mime from 'mime'
import { parseToString } from 'alpha8-lib'
import * as crypto from 'crypto'

export default class HttpDownloadFileTask extends HttpGetTask {
  protected getResponseType(): ResponseType | undefined {
    return 'stream'
  }

  protected getTargetPath(response: AxiosResponse): string {
    const path = parseToString(this.context?.input.get('targetFile'))
    if (path) return path

    const headers = response.headers
    if (headers instanceof AxiosHeaders && headers.has('content-type')) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const contentType = headers['content-type'].toString()

      if (contentType) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const ext = mime.getExtension(contentType)
        const uuid = crypto.randomUUID()
        return `${uuid}.${ext}`
      }
    }
    throw Error('No Path defined')
  }

  getInputMetadata(): InputMetadata {
    const metadata = super.getInputMetadata()
    metadata.fields.concat([{ name: 'targetFile', type: 'string' }])
    return metadata
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  protected async processResult(
    result: AxiosResponse,
    context: ExecutableRuntimeContext
  ) {
    //await super.processResult(result, context)
    const path = this.getTargetPath(result)
    context.result.set('path', path)
    const writer = fs.createWriteStream(path)
    result.data.pipe(writer)
    await new Promise((resolve, reject) => {
      writer.on('finish', resolve)
      writer.on('error', reject)
    })
  }
}
