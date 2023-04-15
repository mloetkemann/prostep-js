import { assert } from 'chai'
import ProStepJS from '..'
import { StepType } from '../lib/processConfig'

describe('ProStepJS Test', () => {
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

    const prostepjs = ProStepJS.getProStepJS()
    await prostepjs.loadTaskConfig([taskConfig])
    await prostepjs.loadProcessConfig(processConfig)
    const uuid = await prostepjs.initProcess('CalcProcessTest1')
    const result = await prostepjs.run(uuid, { a: 5, b: 2 })
    assert.equal(result.result, 7)
  })
})
