import Logger from './logger'
import { Step, InputMetadata } from './processConfig'

export interface Executable {
  init(): Promise<void>
  getResults(): Map<string, unknown> | undefined
  getName(): string
  getConfig(): Step
  run(context: ExecutableRuntimeContext): Promise<void>
  getInputMetadata(): InputMetadata
}

export interface ExecutableRuntimeContext {
  input: Map<string, unknown>
  result: Map<string, unknown>
}

export class ExecutableBase implements Executable {
  protected logger!: Logger
  protected results: Map<string, unknown> | undefined

  getInputMetadata(): InputMetadata {
    throw new Error('Method not implemented.')
  }
  getConfig(): Step {
    throw new Error('Method not implemented.')
  }

  init(): Promise<void> {
    throw new Error('Method not implemented.')
  }

  getResults(): Map<string, unknown> | undefined {
    return this.results
  }
  getName(): string {
    throw new Error('Method not implemented.')
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected executeTask(context: ExecutableRuntimeContext): Promise<void> {
    throw new Error('Method not implemented.')
  }

  async run(context: ExecutableRuntimeContext): Promise<void> {
    this.validateInput(context)
    await this.executeTask(context)
  }

  validateInput(context: ExecutableRuntimeContext): void {
    const fields = this.getInputMetadata().fields
    if (fields) {
      fields.forEach(field => {
        if (field.required) {
          const current_field = context.input.get(field.name)
          if (!current_field) {
            throw Error(`Input field "${field.name}" missing`)
          }

          if (typeof current_field !== field.type) {
            throw Error('Wrong Type')
          }
        }
      })
    }
  }

  protected mapInputOption(key: string, value: string): unknown {
    const field = this.getInputMetadata().fields.find(
      field => field.name === key
    )
    if (field) {
      if (field.options) {
        return field.options.get(value)
      } else {
        throw Error('Field has no options')
      }
    } else {
      throw Error('Field not found')
    }
  }
}
