/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { ExecutableRuntimeContext } from '../base.js'
import { InputMetadata } from '../processConfig.js'
import { TaskBase } from '../task.js'

export default class FileSystemTaskBase extends TaskBase {
  protected context!: ExecutableRuntimeContext
  getInputMetadata(): InputMetadata {
    return {
      fields: [{ name: 'path', type: 'string', required: true }],
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/require-await
  protected async doFileOperation(path: string): Promise<void> {
    throw new Error('Not implemented')
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async executeTask(context: ExecutableRuntimeContext) {
    this.context = context

    const path = this.context.input.get('path') as string

    await this.doFileOperation(path)
  }
}
