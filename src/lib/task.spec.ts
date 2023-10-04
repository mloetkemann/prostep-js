import { assert } from 'chai'
import { TaskBase } from './task'
import TaskRuntimeContext from './taskRuntimeContext'
import { Process } from './processRuntime'
import { ExecutableRuntimeContextBase } from './base'

class Context extends ExecutableRuntimeContextBase {
  constructor(
    input: Map<string, unknown>,
    result: Map<string, unknown>,
    private validator: () => void
  ) {
    super(input, result)
  }
  progress(value: number): void {
    this.validator()
  }
}

describe('Tasks Tests', () => {
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
      type: 'Task',
      arguments: args,
    }

    const task = await TaskBase.getInstance(step, taskConfig)

    const stepContext = new Context(
      new Map<string, unknown>(args),
      new Map<string, unknown>(),
      () => {
        console.log('Test')
      }
    )

    await task.run(stepContext)

    assert.equal(stepContext.result.get('result'), 5)
  })

  it('Run Task with wrong input', async () => {
    // eslint-disable-next-line @typescript-eslint/no-array-constructor
    const args = new Array()
    args.push(['value1', 2])
    args.push(['wrongParam', 3])
    const step = {
      stepName: 'Add',
      name: 'Add',
      type: 'Task',
      arguments: args,
    }

    const task = await TaskBase.getInstance(step, taskConfig)

    const stepContext = new ExecutableRuntimeContextBase(
      new Map<string, unknown>(args),
      new Map<string, unknown>()
    )
    let error = false
    try {
      await task.run(stepContext)
      error = true
    } catch (e) {
      /* empty */
    }

    if (error) {
      assert.fail('No error detected')
    }
  })
})
