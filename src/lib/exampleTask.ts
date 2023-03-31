import { ExecutableRuntimeContext, TaskBase } from './processRuntime'

export default class ExampleTask extends TaskBase {
  async run(context: ExecutableRuntimeContext) {
    const value1 = parseInt(context.input.get('value1'))
    const value2 = parseInt(context.input.get('value2'))

    if (value1 && value2) {
      const result = value1 + value2
      this.logger.info(`Calculate ${value1} + ${value2} = ${result}`)
      context.result.set('result', result)
    }
  }
}
