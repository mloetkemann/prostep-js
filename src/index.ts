import { ProcessConfig, TaskConfig } from './lib/processConfig.js'
import { Process } from './lib/processRuntime.js'
import Logger from './lib/logger.js'
import * as crypto from 'crypto'
import ConfigFile from './lib/util/configFile.js'
import { EventEmit, EventParameter } from 'alpha8-lib'
import { ExecutableStatus } from './lib/base.js'

export default class ProStepJS {
  private static inst: ProStepJS
  private logger = Logger.getLogger('ProStepJS')
  private processConfigurations = new Map<string, ProcessConfig>()
  private taskConfigurations = new Map<string, TaskConfig>()
  private processInstances = new Map<string, Process>()

  private emitter: EventEmit | undefined

  private async _callProcess(param: EventParameter): Promise<void> {
    const processName = param.getString('name')
    const processInput = param.get('input')
    const asyncIdentifier = param.getString('asyncIdentifier')
    if (processName && processInput && typeof processInput == 'object') {
      const uuid = await this.initProcess(processName, asyncIdentifier)
      await this.run(uuid, processInput)
    }
  }

  private async init() {
    this.emitter = await EventEmit.getEmitter()
    await this.emitter.registerEvent('callProcess')
    this.emitter.on('callProcess', async param => {
      return await this._callProcess(param)
    })

    await this.emitter.registerEvent('callForProcessStatus')
    this.emitter.on('callForProcessStatus', async param => {
      return this._callForProcessStatus(param)
    })
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private async _callForProcessStatus(_param: EventParameter) {
    const status = {
      processes: new Array<{ key: string; status: ExecutableStatus }>(),
    }
    this.processInstances.forEach((proc, key) => {
      const thisProcesss = {
        key: key,
        status: proc.getStatus(),
      }
      status.processes.push(thisProcesss)
    })
    this.logger.info(`Call for Status`)
    this.logger.info(JSON.stringify(status))
    await this.triggerEvent('statusCallback', status)
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

  public loadTaskConfig(taskConfigs: TaskConfig[]) {
    taskConfigs.forEach(taskConfig => {
      if (!this.taskConfigurations.has(taskConfig.name)) {
        this.logger.info(`Task ${taskConfig.name} loaded`)
        this.taskConfigurations.set(taskConfig.name, taskConfig)
      }
    })
  }

  public loadProcessConfig(processConfig: ProcessConfig) {
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
      this.logger.info(`Init Process ${instanceUUID}`)
      await process.init()
      this.processInstances.set(instanceUUID, process)
    }

    return instanceUUID
  }

  private async triggerEvent(event: string, param: object) {
    await this.emitter?.trigger(event, param)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public async run(processUUID: string, args: object): Promise<any> {
    const process = this.processInstances.get(processUUID)
    if (process) {
      await this.triggerEvent('startProcess', {
        uuid: processUUID,
        asyncIdentifier: process.getAsyncIdentifier(),
      })

      try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const result = await this.runProcess(process, args)

        await this.triggerEvent('finishProcess', {
          uuid: processUUID,
          asyncIdentifier: process.getAsyncIdentifier(),
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          result: result,
        })
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return result
      } catch (e) {
        await this.triggerEvent('failedProcess', {
          uuid: processUUID,
          asyncIdentifier: process.getAsyncIdentifier(),
        })
      }
    } else {
      throw Error(`Could not find process with UUID ${processUUID}`)
    }
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

  public static async getProStepJS() {
    if (!ProStepJS.inst) {
      ProStepJS.inst = new ProStepJS()
      await ProStepJS.inst.init()
    }
    return ProStepJS.inst
  }
}

export * from './lib/logger.js'
export * from './lib/processConfig.js'
export * from './lib/processRuntime.js'
export * from './lib/tasks/processTaskBase.js'
export { EventEmit as ProStepEventEmitter }
