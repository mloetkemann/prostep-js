/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { FieldMetaData, InputMetadata } from '../processConfig.js'
import { TaskBase } from '../task.js'
import Stream from 'stream'

export class OutputStream extends Stream.Writable {
  constructor(private callback: (str: string) => void) {
    super()
  }

  _write(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    chunk: any,
    encoding: BufferEncoding,
    next: (error?: Error | null | undefined) => void
  ) {
    let str = ''
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    str = chunk.toString()
    this.callback(str)
    next()
  }
}

export class NodeProcessTaskBase extends TaskBase {
  protected stdErrStream: OutputStream | undefined
  protected sdtoutStream: OutputStream | undefined

  getInputMetadata(): InputMetadata {
    return {
      fields: new Array<FieldMetaData>(),
    }
  }

  protected async runNodeProcess(
    command: string,
    args: string[]
  ): Promise<string> {
    let execa
    if (typeof execa == 'undefined') {
      const mod = await (eval(`import('execa')`) as Promise<
        typeof import('execa')
      >)
      ;({ execa } = mod)
    }

    const childProcess = execa(command, args, {
      encoding: 'buffer',
    })

    if (this.stdErrStream) {
      if (childProcess.pipeStderr)
        void childProcess.pipeStderr(this.stdErrStream)
    }

    if (this.sdtoutStream) {
      if (childProcess.pipeStdout)
        void childProcess.pipeStdout(this.sdtoutStream)
    }

    const { stdout, stderr } = await childProcess

    this.logger.verbose('stdout:')
    this.logger.verbose(stdout.toString())
    this.logger.verbose('stderr:')
    this.logger.verbose(stderr.toString())
    return stdout.toString()
  }
}
