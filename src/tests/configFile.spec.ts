import { assert, expect } from 'chai'
import ConfigFile from '../lib/util/configFile'
import { ProcessConfig, TaskConfig } from '../lib/processConfig'

const getSampleConfig = function (): [ProcessConfig, TaskConfig[]] {
  const taskConfig = {
    name: 'add',
    path: './exampleTask',
  }

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
  return [processConfig, [taskConfig]]
}

const assertSampleConfig = function (actual: [ProcessConfig[], TaskConfig[]]) {
  const [processConfig, taskConfigs] = getSampleConfig()
  assert.equal(actual[0][0].name, 'CalcProcessTest2')
  expect(actual[0][0]).to.eql(processConfig)

  assert.equal(actual[1][0].name, 'add')
  expect(actual[1]).to.eql(taskConfigs)
}

describe('Config File Parser', () => {
  it('parse wrong YAML file', async () => {
    const configFile = new ConfigFile('src/tests/tasks.yaml')
    try {
      await configFile.readConfig()
      assert.fail('Expected failing while parsing yaml file')
      // eslint-disable-next-line no-empty
    } catch (e) {}
  })
  it('parse wrong JSON file', async () => {
    const configFile = new ConfigFile('src/tests/tasks.json')
    try {
      await configFile.readConfig()
      assert.fail('Expected failing while parsing yaml file')
      // eslint-disable-next-line no-empty
    } catch (e) {}
  })

  it('parse YAML Config', async () => {
    const configFile = new ConfigFile('src/tests/exampleProcess.yaml')
    const config = await configFile.readConfig()

    assertSampleConfig(config)
  })

  it('parse JSON file', async () => {
    const configFile = new ConfigFile('src/tests/exampleProcess.json')
    const config = await configFile.readConfig()

    assertSampleConfig(config)
  })
})
