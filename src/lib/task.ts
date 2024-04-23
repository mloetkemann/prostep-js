import Logger from './logger.js'
import { Step, TaskConfig } from './processConfig.js'
import { instantiateTask } from './fileUtil.js'
import { Executable, ExecutableBase } from './base.js'

export class TaskBase extends ExecutableBase {
  protected results: Map<string, unknown> | undefined

  static async getInstance(
    stepConfig: Step,
    taskConfig: TaskConfig
  ): Promise<Executable> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const mod = await instantiateTask(taskConfig.path)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
    return new mod(stepConfig, taskConfig)
  }

  constructor(protected stepConfig: Step, protected taskConfig: TaskConfig) {
    super()
    this.logger = Logger.getLogger(`task:${stepConfig.stepName}`)
  }

  getConfig(): Step {
    return this.stepConfig
  }
  getName(): string {
    return this.stepConfig.name
  }
}
