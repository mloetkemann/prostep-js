import { ProcessConfig, TaskConfig } from './lib/processConfig'
import { Process } from './lib/processRuntime'
import Logger from './lib/logger'
import * as crypto from 'crypto'

export default class ProStepJS {
  private static inst: ProStepJS
  private logger = Logger.getLogger('ProStepJS')
  private processConfigurations = new Map<string, ProcessConfig>()
  private taskConfigurations = new Map<string, TaskConfig>()
  private processInstances = new Map<string, Process>()

  private constructor() {
    if (require.main) this.logger.info(require.main.filename)
    module.paths.forEach(m => this.logger.info(m))
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async loadConfigFromFile(filePath: string) {
    throw Error('Not implemented yet')
  }

  public async loadTaskConfig(taskConfigs: TaskConfig[]) {
    taskConfigs.forEach(taskConfig => {
      if (!this.taskConfigurations.has(taskConfig.name)) {
        this.logger.info(`Task ${taskConfig.name} loaded`)
        this.taskConfigurations.set(taskConfig.name, taskConfig)
      }
    })
  }

  public async loadProcessConfig(processConfig: ProcessConfig) {
    if (!this.processConfigurations.has(processConfig.name)) {
      this.logger.info(`Process ${processConfig.name} loaded`)
      this.processConfigurations.set(processConfig.name, processConfig)
    }
  }

  public async initProcess(name: string): Promise<string> {
    const instanceUUID = crypto.randomUUID()

    const processConfig = this.processConfigurations.get(name)
    if (processConfig) {
      const taskConfigs = Array.from(
        this.taskConfigurations,
        ([, value]) => value
      )
      const process = new Process(processConfig, taskConfigs)
      await process.init()
      this.processInstances.set(instanceUUID, process)
    }

    return instanceUUID
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public async run(processUUID: string, args: object): Promise<any> {
    const process = this.processInstances.get(processUUID)
    if (process) {
      return await this.runProcess(process, args)
    }
    throw Error(`Could not find process with UUID ${processUUID}`)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async runProcess(process: Process, args: object): Promise<any> {
    if (process) {
      const keyValue = Object.entries(args)
      const context = {
        input: new Map<string, unknown>(keyValue),
        result: new Map<string, unknown>(),
      }
      await process.run(context)
      const result = Object.fromEntries(context.result)
      return result
    } else {
      throw Error('Process not initialized. Please load configuration first.')
    }
    return {}
  }

  public static getProStepJS() {
    ProStepJS.inst = new ProStepJS()
    return ProStepJS.inst
  }
}

export * from './lib/logger'
export * from './lib/processConfig'
export * from './lib/processRuntime'
