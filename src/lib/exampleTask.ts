import { ExecutableRuntimeContext } from './base'
import { InputMetadata, TaskBase } from './processRuntime'

function parseToNumber(value: unknown): number | undefined {
  return typeof value === 'number' ? value : undefined
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
