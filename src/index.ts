import { ProcessConfig, TaskConfig } from './lib/processConfig'
import { Process } from './lib/processRuntime'
import Logger from './lib/logger'
import * as crypto from 'crypto'
import ConfigFile from './lib/util/configFile'
import { EventEmit } from 'alpha8-lib'

export default class ProStepJS {
  private static inst: ProStepJS
  private logger = Logger.getLogger('ProStepJS')
  private processConfigurations = new Map<string, ProcessConfig>()
  private taskConfigurations = new Map<string, TaskConfig>()
  private processInstances = new Map<string, Process>()

  private constructor() {
    EventEmit.getEmitter().registerEvents([
      'callProcess',
      'startProcess',
      'finishProcess',
      'failedProcess',
    ])
    EventEmit.getEmitter().on('callProcess', async param => {
      const processName = param.getString('name')
      const processInput = param.get('input')
      const asyncIdentifier = param.getString('asyncIdentifier')
      if (processName && processInput && typeof processInput == 'object') {
        const uuid = await this.initProcess(processName, asyncIdentifier)
        await this.run(uuid, processInput)
      }
    })
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public async loadConfigFromFile(filePath: string) {
    const configFile = new ConfigFile(filePath)
    const [processConfigs, taskConfigs] = await configFile.readConfig()
    this.loadTaskConfig(taskConfigs)
    processConfigs.forEach(processConfig =>
      this.loadProcessConfig(processConfig)
    )
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

  public async initProcess(
    name: string,
    asyncIdentifier?: string
  ): Promise<string> {
    const instanceUUID = crypto.randomUUID()

    const processConfig = this.processConfigurations.get(name)
    if (processConfig) {
      const taskConfigs = Array.from(
        this.taskConfigurations,
        ([, value]) => value
      )
      const process = new Process(processConfig, taskConfigs, asyncIdentifier)
      await process.init()
      this.processInstances.set(instanceUUID, process)
    }

    return instanceUUID
  }

  private triggerEvent(event: string, param: object) {
    EventEmit.getEmitter().trigger(event, param)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public async run(processUUID: string, args: object): Promise<any> {
    const process = this.processInstances.get(processUUID)
    if (process) {
      this.triggerEvent('startProcess', {
        uuid: processUUID,
        asyncIdentifier: process.getAsyncIdentifier(),
      })

      try {
        const result = await this.runProcess(process, args)

        this.triggerEvent('finishProcess', {
          uuid: processUUID,
          asyncIdentifier: process.getAsyncIdentifier(),
          result: result,
        })
        return result
      } catch (e) {
        this.triggerEvent('failedProcess', {
          uuid: processUUID,
          asyncIdentifier: process.getAsyncIdentifier(),
        })
        throw e
      }
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
    if (!ProStepJS.inst) ProStepJS.inst = new ProStepJS()
    return ProStepJS.inst
  }
}

export * from './lib/logger'
export * from './lib/processConfig'
export * from './lib/processRuntime'
export { EventEmit as ProStepEventEmitter }
