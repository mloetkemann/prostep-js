import Logger from './logger'
import { ProcessConfig, Step, TaskConfig, StepType } from './processConfig'
import { instantiateTask } from './fileUtil'

export interface Executable {
  init(): Promise<void>
  getResults(): Map<string, unknown> | undefined
  getName(): string
  getConfig(): Step
  run(context: ExecutableRuntimeContext): Promise<void>
}

export interface ExecutableRuntimeContext {
  input: Map<string, unknown>
  result: Map<string, unknown>
}

export class TaskBase implements Executable {
  protected logger: Logger
  protected results: Map<string, unknown> | undefined

  static async getInstance(
    stepConfig: Step,
    taskConfig: TaskConfig
  ): Promise<Executable> {
    const mod = await instantiateTask(taskConfig.path)
    return new mod(stepConfig, taskConfig)
  }

  constructor(protected stepConfig: Step, protected taskConfig: TaskConfig) {
    this.logger = Logger.getLogger(`task:${stepConfig.stepName}`)
  }
  getConfig(): Step {
    return this.stepConfig
  }

  init(): Promise<void> {
    throw new Error('Method not implemented.')
  }

  getResults(): Map<string, unknown> | undefined {
    return this.results
  }
  getName(): string {
    return this.stepConfig.name
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async run(context: ExecutableRuntimeContext): Promise<void> {
    throw new Error('Method not implemented.')
  }
}

export class Process implements Executable {
  protected results: Map<string, unknown> | undefined
  private variables = new Map<string, unknown>()
  private constants = new Map<string, unknown>()
  private steps = Array<Executable>()
  protected logger: Logger

  constructor(
    private processConfig: ProcessConfig,
    private taskConfig: TaskConfig[]
  ) {
    this.logger = Logger.getLogger(`process:${processConfig.name}`)
    if (processConfig.constants) {
      processConfig.constants.forEach(constant => {
        this.constants.set(constant.key, constant.value)
      })
    }
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
      this.logger.error('Error Instantiation')
      throw e
    }
  }

  private async instantiateStep(step: Step): Promise<Executable> {
    this.logger.info(`Init Step ${step.stepName}`)
    if (step.type === StepType.Task) {
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
    const re = /\$\{([a-z0-9]*:[a-z0-9]*)\}/i // RegExp for ${input:a)}
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
    this.mapContext(context.input, this.variables, 'input')
    if (this.processConfig.constants) {
      this.mapContext(this.constants, this.variables, 'const')
    }

    for (const step of this.steps) {
      await this.runSingleStep(step)
    }
    this.processConfig.results.forEach(resultConfig => {
      context.result.set(
        resultConfig.key,
        this.getArgumentValue(resultConfig.value)
      )
    })
    this.results = context.result
    this.logger.info(`Finish Process`)
  }
}
