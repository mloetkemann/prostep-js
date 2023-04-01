import { ExecutableRuntimeContext, TaskBase } from './processRuntime'

function parseToString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}

function parseToNumber(value: unknown): number | undefined {
  const valueStr = parseToString(value)
  if (valueStr) {
    return parseInt(valueStr)
  }
  return typeof value === 'number' ? value : undefined
}

export default class ExampleTask extends TaskBase {
  async run(context: ExecutableRuntimeContext) {
    const value1 = parseToNumber(context.input.get('value1'))
    const value2 = parseToNumber(context.input.get('value2'))

    if (value1 && value2) {
      const result = value1 + value2
      this.logger.info(`Calculate ${value1} + ${value2} = ${result}`)
      context.result.set('result', result)
    }
  }
}
