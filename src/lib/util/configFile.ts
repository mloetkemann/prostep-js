import { readFile } from 'fs/promises'
import { load } from 'js-yaml'
import { ProcessConfig, TaskConfig } from '../processConfig'
import Logger from '../logger'

interface ConfigFileContent {
  process: ProcessConfig[]
  task: TaskConfig[]
}

export default class ConfigFile {
  private logger = Logger.getLogger('ConfigFile')
  constructor(private path: string) {}

  private async readJSONContent(
    content: string
  ): Promise<[ProcessConfig[], TaskConfig[]]> {
    this.logger.verbose(`Try to parse as json file`)
    const parsedContent = JSON.parse(content)
    if (typeof parsedContent == 'object') {
      this.logger.verbose(JSON.stringify(parsedContent))
      const config = parsedContent as ConfigFileContent
      return [config.process, config.task]
    }
    throw Error('could not parse as json file')
  }

  private async readYAMLContent(
    content: string
  ): Promise<[ProcessConfig[], TaskConfig[]]> {
    this.logger.verbose(`Try to parse as yaml file`)

    const parsedContent = load(content)
    if (typeof parsedContent == 'object') {
      const config = parsedContent as ConfigFileContent
      this.logger.verbose(JSON.stringify(parsedContent))
      return [config.process, config.task]
    }
    throw Error('could not parse as yaml file')
  }

  public async readConfig(): Promise<[ProcessConfig[], TaskConfig[]]> {
    this.logger.verbose(`Read config file ${this.path}`)
    try {
      const fileContent = await readFile(this.path, 'utf-8')
      try {
        return await this.readYAMLContent(fileContent)
      } catch (e) {
        this.logger.verbose(`Seems to be no yaml file`)
      }

      try {
        return await this.readJSONContent(fileContent)
      } catch (e) {
        this.logger.verbose(`Seems to be no json file`)
      }
      this.logger.verbose(fileContent)
      throw Error('File could not be parsed neither as yaml nor json')
    } catch (e) {
      this.logger.error(`Error while parsing file`)
      if (e instanceof Error) this.logger.error(e.message)
    }
    throw Error('Error while parsing file')
  }
}
