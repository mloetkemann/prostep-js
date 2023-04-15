import { assert } from 'chai'
import ProStepJS from '..'
import { ProcessConfig, TaskConfig } from '../lib/processConfig'

const getSampleConfig = function (): [ProcessConfig, TaskConfig[]] {
  const taskConfig = {
    name: 'add',
    path: './exampleTask',
  }

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
  return [processConfig, [taskConfig]]
}

const initSampleProcess = async function (): Promise<ProStepJS> {
  const [processConfig, taskConfigs] = getSampleConfig()
  const prostepjs = ProStepJS.getProStepJS()
  await prostepjs.loadTaskConfig(taskConfigs)
  await prostepjs.loadProcessConfig(processConfig)
  return prostepjs
}

const expectErrorWhileRunning = async function (
  prostep: ProStepJS,
  uuid: string,
  args: object
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
  try {
    return await prostep.run(uuid, args)
    assert.fail('Error expected')
  } catch (e) {
    /* empty */
  }
}

describe('ProStepJS Test', () => {
  it('Run Process', async () => {
    const prostepjs = await initSampleProcess()
    const uuid = await prostepjs.initProcess('CalcProcessTest1')
    const result = await prostepjs.run(uuid, { a: 5, b: 2 })
    assert.equal(result.result, 7)
  })

  it('Test run with wrong argument', async () => {
    const prostepjs = await initSampleProcess()
    const uuid = await prostepjs.initProcess('CalcProcessTest1')
    await expectErrorWhileRunning(prostepjs, uuid, { wrongArgument: 5, b: 2 })
  })

  it('Test run with wrong uuid', async () => {
    const prostepjs = ProStepJS.getProStepJS()

    await expectErrorWhileRunning(prostepjs, 'jjj', {})
  })
})
