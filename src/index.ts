import { ProcessConfig, TaskConfig } from './lib/processConfig'
import { Process } from './lib/processRuntime'
import Logger from './lib/logger'
import { dirname } from 'path'

export default class ProStepJS {
  private static inst: ProStepJS
  private process: Process | undefined
  private logger = Logger.getLogger('ProStepJS')

  private constructor() {
    if (require.main) this.logger.info(require.main.filename)
    module.paths.forEach(m => this.logger.info(m))
  }

  public async loadConfigFromFile(filePath: string) {
    throw Error('Not implemented yet')
  }

  public async loadConfig(
    processConfig: ProcessConfig,
    taskConfig: TaskConfig[]
  ) {
    this.process = new Process(processConfig, taskConfig)
    await this.process.init()
  }

  public async run(args: object): Promise<any> {
    if (this.process) {
      const keyValue = Object.entries(args)
      const context = {
        input: new Map<string, any>(keyValue),
        result: new Map<string, any>(),
      }
      await this.process.run(context)
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
