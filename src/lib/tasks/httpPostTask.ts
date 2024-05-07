import { ExecutableRuntimeContext } from '../base.js'
import { Method } from 'axios'
import HttpGetTask from './httpGetTask.js'

export default class HttpPostTask extends HttpGetTask {
  protected context?: ExecutableRuntimeContext

  protected getMethod(): Method {
    return 'post'
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  protected getData(): any {
    throw new Error('Not implemented')
  }
}
