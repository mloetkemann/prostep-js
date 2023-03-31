import { assert } from 'chai'
import { StepType, TaskConfig } from './processConfig'
import { KeyValue, Process, TaskBase } from './processRuntime'

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
      input: new Map<string, any>(args),
      result: new Map<string, any>(),
    }
    await task.run(stepContext)

    assert.equal(stepContext.result.get('result'), 5)
  })

  it('Run Process', async () => {
    const processConfig = {
      name: 'CalcProcessTest1',
      inputs: ['a', 'b'],
      steps: [
        {
          stepName: 'Add',
          name: 'add',
          type: StepType.Task,
          arguments: [
            {
              key: 'value1',
              value: '${input:a}',
            },
            {
              key: 'value2',
              value: '${input:b}',
            },
          ],
        },
      ],
      results: [
        {
          key: 'result',
          value: '${Add:result}',
        },
      ],
    }

    const process = new Process(processConfig, [taskConfig])
    await process.init()
    const processContext = {
      input: new Map<string, any>([
        ['a', 2],
        ['b', 3],
      ]),
      result: new Map<string, any>(),
    }
    await process.run(processContext)
    assert.equal(processContext.result.get('result'), 5)
  })

  it('Run Process with 2 Tasks', async () => {
    const processConfig = {
      name: 'CalcProcessTest2',
      inputs: ['a', 'b', 'c'],
      steps: [
        {
          stepName: 'Add',
          name: 'add',
          type: StepType.Task,
          arguments: [
            {
              key: 'value1',
              value: '${input:a}',
            },
            {
              key: 'value2',
              value: '${input:b}',
            },
          ],
        },
        {
          stepName: 'Add2',
          name: 'add',
          type: StepType.Task,
          arguments: [
            {
              key: 'value1',
              value: '${Add:result}',
            },
            {
              key: 'value2',
              value: '${input:c}',
            },
          ],
        },
      ],
      results: [
        {
          key: 'result',
          value: '${Add2:result}',
        },
      ],
    }

    const process = new Process(processConfig, [taskConfig])
    await process.init()
    const processContext = {
      input: new Map<string, any>([
        ['a', 2],
        ['b', 3],
        ['c', 4],
      ]),
      result: new Map<string, any>(),
    }
    await process.run(processContext)
    assert.equal(processContext.result.get('result'), 9)
  })
})
