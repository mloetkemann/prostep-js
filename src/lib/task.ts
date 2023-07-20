import Logger from './logger'
import { Step, TaskConfig } from './processConfig'
import { instantiateTask } from './fileUtil'
import { Executable, ExecutableBase } from './base'

export class TaskBase extends ExecutableBase {
  protected results: Map<string, unknown> | undefined

  static async getInstance(
    stepConfig: Step,
    taskConfig: TaskConfig
  ): Promise<Executable> {
    const mod = await instantiateTask(taskConfig.path)
    console.log(mod)
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
