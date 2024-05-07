import { ExecutableRuntimeContext } from './base.js'
import { InputMetadata, TaskBase } from './processRuntime.js'

function parseToNumber(value: unknown): number | undefined {
  if (typeof value === 'number') return value
  if (typeof value === 'string') return parseInt(value)
  return undefined
}

export default class ExampleTask extends TaskBase {
  getInputMetadata(): InputMetadata {
    return {
      fields: [
        { name: 'value1', type: 'number', required: true },
        { name: 'value2', type: 'number', required: true },
        { name: 'optionalField', type: 'number' },
      ],
    }
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async executeTask(context: ExecutableRuntimeContext) {
    const value1 = parseToNumber(context.input.get('value1'))
    const value2 = parseToNumber(context.input.get('value2'))

    if (value1 && value2) {
      const result = value1 + value2
      this.logger.info(`Calculate ${value1} + ${value2} = ${result}`)
      context.result.set('result', result)
    }
  }
}
