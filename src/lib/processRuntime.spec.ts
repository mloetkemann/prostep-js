import { assert } from 'chai'
import { Process } from './processRuntime.js'

const PROCESS_NODE = process

describe('Process Runtime Tests', () => {
  const taskConfig = {
    name: 'add',
    path: './exampleTask.js',
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
    const processContext = {
      input: new Map<string, unknown>([
        ['a', 2],
        ['b', 3],
      ]),
      result: new Map<string, unknown>(),
    }
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
    const processContext = {
      input: new Map<string, unknown>([
        ['a', 2],
        ['b', 3],
        ['c', 4],
      ]),
      result: new Map<string, unknown>(),
    }
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
    const processContext = {
      input: new Map<string, unknown>([
        ['a', 2],
        ['c', 4],
      ]),
      result: new Map<string, unknown>(),
    }
    await process.run(processContext)
    assert.equal(processContext.result.get('result'), 11)
  })

  it('Run Process with env', async () => {
    PROCESS_NODE.env['TEST_B'] = '3'
    const processConfig = {
      name: 'CalcProcessTest1',
      environment: ['TEST_B'],
      inputs: {
        fields: [{ name: 'a', type: 'number' }],
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
              value: '${env:TEST_B}',
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
      input: new Map<string, unknown>([['a', 2]]),
      result: new Map<string, unknown>(),
    }
    await process.run(processContext)
    assert.equal(processContext.result.get('result'), 5)
  })
})
