import Logger from './logger.js'
import {
  ProcessConfig,
  Step,
  TaskConfig,
  InputMetadata,
} from './processConfig.js'
import {
  Executable,
  ExecutableBase,
  ExecutableRuntimeContext,
  ExecutableStatus,
} from './base.js'
import { TaskBase } from './task.js'

export class Process extends ExecutableBase {
  protected results: Map<string, unknown> | undefined
  private variables = new Map<string, unknown>()
  private constants = new Map<string, unknown>()
  private environment = new Map<string, string>()
  private steps = Array<Executable>()

  constructor(
    private processConfig: ProcessConfig,
    private taskConfig: TaskConfig[],
    private asyncIdentifier?: string
  ) {
    super()
    this.logger = Logger.getLogger(`process:${processConfig.name}`)
    if (processConfig.constants) {
      processConfig.constants.forEach(constant => {
        this.constants.set(constant.key, constant.value)
      })
    }

    if (processConfig.environment) {
      processConfig.environment.forEach(environtmentVar => {
        const value = process.env[environtmentVar]
        if (value) {
          this.environment.set(environtmentVar, value)
        }
      })
    }
  }

  getInputMetadata(): InputMetadata {
    return this.processConfig.inputs
  }

  getConfig(): Step {
    throw new Error('Method not implemented.')
  }

  private async initTask(step: Step): Promise<Executable> {
    try {
      const config = this.taskConfig.find(item => item.name === step.name)
      if (config) {
        return TaskBase.getInstance(step, config)
      } else {
        throw Error('Could not find Task Config for instantiation')
      }
    } catch (e) {
      this.logger.trace('Error Instantiation', e)

      throw e
    }
  }

  private async instantiateStep(step: Step): Promise<Executable> {
    this.logger.info(`Init Step ${step.stepName}`)
    if (step.type === 'Task') {
      return this.initTask(step)
    }
    throw Error(`Task Definition of ${step.name} not found`)
  }

  async init() {
    this.logger.info(`Init Process ${this.getName()}`)
    this.steps = await Promise.all(
      this.processConfig.steps.map(async item => {
        const step = await this.instantiateStep(item)
        return step
      })
    )
  }

  getResults(): Map<string, unknown> | undefined {
    return this.results
  }

  public getName(): string {
    return this.processConfig.name
  }

  private mapContext(
    from: Map<string, unknown>,
    to: Map<string, unknown>,
    prefix: string
  ) {
    from.forEach((value, key) => {
      const newKey = `${prefix}:${key}`
      to.set(newKey, value)
    })
  }

  private replaceParameter(value: string): unknown {
    const re = /\$\{([a-z0-9]*:[a-z0-9_]*)\}/i // RegExp for ${input:a)}
    const match = value.match(re)
    if (match) {
      const key = match[1]
      return this.variables.get(key)
    }
    return value
  }

  private getArgumentValue(value: unknown): unknown {
    if (typeof value === 'string') {
      return this.replaceParameter(value.toString())
    }
    return value
  }

  async runSingleStep(step: Executable) {
    const stepContext = {
      input: new Map<string, unknown>(),
      result: new Map<string, unknown>(),
    }

    const stepConfig = step.getConfig()
    stepConfig.arguments.forEach(args => {
      stepContext.input.set(args.key, this.getArgumentValue(args.value))
    })

    this.logger.info(`Start Step: ${stepConfig.stepName}`)
    await step.run(stepContext)
    this.logger.info(`Finish Step: ${stepConfig.stepName}`)

    this.mapContext(stepContext.result, this.variables, stepConfig.stepName)
  }

  async run(context: ExecutableRuntimeContext): Promise<void> {
    this.logger.info(`Run Process`)
    this.logger.info('Validate Input')

    this.status = ExecutableStatus.RUNNING
    try {
      this.validateInput(context)
    } catch (err: unknown) {
      if (err instanceof Error) {
        this.logger.error(err.message)
        throw err
      }
    }
    this.mapContext(context.input, this.variables, 'input')
    if (this.processConfig.constants) {
      this.mapContext(this.constants, this.variables, 'const')
    }

    this.mapContext(this.environment, this.variables, 'env')

    try {
      for (const step of this.steps) {
        await this.runSingleStep(step)
      }
    } catch (e) {
      this.status = ExecutableStatus.FAILED
      this.logger.trace(`Process stopped`, e)
      throw e
    }

    this.status = ExecutableStatus.FINISHED

    this.processConfig.results.forEach(resultConfig => {
      context.result.set(
        resultConfig.key,
        this.getArgumentValue(resultConfig.value)
      )
    })
    this.results = context.result
    this.logger.info(`Finish Process`)
  }

  public getAsyncIdentifier(): string | undefined {
    return this.asyncIdentifier
  }
}
export { InputMetadata, TaskBase }
