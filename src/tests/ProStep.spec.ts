import { assert } from 'chai'
import ProStepJS from '..'
import { ProcessConfig, TaskConfig } from '../lib/processConfig'
import { EventEmit } from 'alpha8-lib'

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
  const prostepjs = await ProStepJS.getProStepJS()
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

  it('Run Process with config file', async () => {
    const prostepjs = await ProStepJS.getProStepJS()
    await prostepjs.loadConfigFromFile('src/tests/exampleProcess.yaml')
    const uuid = await prostepjs.initProcess('CalcProcessTest2')
    const result = await prostepjs.run(uuid, { a: 5, b: 2 })
    assert.equal(result.result, 7)
  })

  it('Run Process with wrong config file', async () => {
    const prostepjs = await ProStepJS.getProStepJS()
    try {
      await prostepjs.loadConfigFromFile('src/tests/tasks.yaml')
      assert.fail('Error expected')
    } catch (e) {
      /* empty */
    }
  })

  it('Test run with wrong argument', async () => {
    const prostepjs = await initSampleProcess()
    const uuid = await prostepjs.initProcess('CalcProcessTest1')
    await expectErrorWhileRunning(prostepjs, uuid, { wrongArgument: 5, b: 2 })
  })

  it('Test run with wrong uuid', async () => {
    const prostepjs = await ProStepJS.getProStepJS()

    await expectErrorWhileRunning(prostepjs, 'jjj', {})
  })

  it('Run Process async', done => {
    const identifier = 'abc'
    EventEmit.getEmitter().then(emitter => {
      emitter.registerEvent('finishProcess').then(() => {
        emitter.on('finishProcess', param => {
          const finishIdentifier = param.get('asyncIdentifier')
          if (
            finishIdentifier &&
            typeof finishIdentifier == 'string' &&
            identifier == finishIdentifier
          ) {
            const result = param.getObject('result')
            if (result) {
              type ObjectKey = keyof typeof result

              const myVar = 'result' as ObjectKey
              if (result[myVar] === 7) {
                done()
                return
              }
            }
            done(new Error('Wrong result'))
          }
        })
      })
    })
    initSampleProcess().then(async () => {
      const emitter = await EventEmit.getEmitter()
      emitter.trigger('callProcess', {
        name: 'CalcProcessTest1',
        input: { a: 5, b: 2 },
        asyncIdentifier: identifier,
      })
    })
  })
})
