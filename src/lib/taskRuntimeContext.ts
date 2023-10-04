import { ExecutableRuntimeContextBase } from './base'
import { Step } from './processConfig'
import { Process } from './processRuntime'

export default class TaskRuntimeContext extends ExecutableRuntimeContextBase {
  constructor(
    private process: Process,
    private stepConfig: Step,
    entries?: [string, any][]
  ) {
    super(new Map<string, unknown>(entries), new Map<string, unknown>())
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  progress(value: number): void {
    this.process.setTaskProgress(value, this.stepConfig)
  }
}
