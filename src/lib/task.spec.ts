import { assert } from 'chai'
import { TaskBase } from './task'
import { StepType } from './processConfig'

describe('Process Runtime Tests', () => {
  const taskConfig = {
    name: 'add',
    path: './exampleTask',
  }

  it('Run Task', async () => {
    // eslint-disable-next-line @typescript-eslint/no-array-constructor
    const args = new Array()
    args.push(['value1', 2])
    args.push(['value2', 3])
    const step = {
      stepName: 'Add',
      name: 'Add',
      type: StepType.Task,
      arguments: args,
    }

    const task = await TaskBase.getInstance(step, taskConfig)
    const stepContext = {
      input: new Map<string, unknown>(args),
      result: new Map<string, unknown>(),
    }
    await task.run(stepContext)

    assert.equal(stepContext.result.get('result'), 5)
  })
})
