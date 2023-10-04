import { assert } from 'chai'
import { Process } from './processRuntime'
import ProcessRuntimeContext from './processRuntimeContext'

describe('Process Runtime Tests', () => {
  const taskConfig = {
    name: 'add',
    path: './exampleTask',
  }

  it('Run Process', async () => {
    const processConfig = {
      name: 'CalcProcessTest1',
      inputs: {
        fields: [
          { name: 'a', type: 'number' },
          { name: 'b', type: 'number' },
        ],
      },
      steps: [
        {
          stepName: 'Add',
          name: 'add',
          type: 'Task',
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
    const processContext = new ProcessRuntimeContext()
    processContext.input.set('a', 2)
    processContext.input.set('b', 3)

    await process.run(processContext)
    assert.equal(processContext.result.get('result'), 5)
  })

  it('Run Process with 2 Tasks', async () => {
    const processConfig = {
      name: 'CalcProcessTest2',
      inputs: {
        fields: [
          { name: 'a', type: 'number' },
          { name: 'b', type: 'number' },
          { name: 'c', type: 'number' },
        ],
      },
      steps: [
        {
          stepName: 'Add',
          name: 'add',
          type: 'Task',
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
          type: 'Task',
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

    const processContext = new ProcessRuntimeContext()
    processContext.input.set('a', 2)
    processContext.input.set('b', 3)
    processContext.input.set('c', 4)

    await process.run(processContext)
    assert.equal(processContext.result.get('result'), 9)
  })

  it('Run Process with 2 Tasks and constants', async () => {
    const processConfig = {
      name: 'CalcProcessTest2Constant',
      inputs: {
        fields: [
          { name: 'a', type: 'number' },
          { name: 'c', type: 'number' },
        ],
      },
      constants: [
        {
          key: 'valb',
          value: 5,
        },
      ],
      steps: [
        {
          stepName: 'Add',
          name: 'add',
          type: 'Task',
          arguments: [
            {
              key: 'value1',
              value: '${input:a}',
            },
            {
              key: 'value2',
              value: '${const:valb}',
            },
          ],
        },
        {
          stepName: 'Add2',
          name: 'add',
          type: 'Task',
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

    const processContext = new ProcessRuntimeContext()
    processContext.input.set('a', 2)
    processContext.input.set('c', 4)

    await process.run(processContext)
    assert.equal(processContext.result.get('result'), 11)
  })

  it('Test task with failure', async () => {
    const processConfig = {
      name: 'CalcProcessTest2',
      inputs: {
        fields: [
          { name: 'a', type: 'number' },
          { name: 'b', type: 'number' },
        ],
      },
      steps: [
        {
          stepName: 'Add',
          name: 'add',
          type: 'Task',
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

    const taskConfig = {
      name: 'add',
      path: '../../src/tests/taskToFail.ts',
    }

    const process = new Process(processConfig, [taskConfig])
    await process.init()

    const processContext = new ProcessRuntimeContext()
    processContext.input.set('a', 2)
    processContext.input.set('b', 3)

    let noErrorHappened = false
    try {
      await process.run(processContext)
      noErrorHappened = true
      // eslint-disable-next-line no-empty
    } catch (err) {}

    if (noErrorHappened) {
      assert.fail('Process finished. Failure expected')
    }
  })
})
