import { join, dirname } from 'path'
import { access, constants } from 'node:fs'
import Logger from './logger'

const logger = Logger.getLogger('TaskImporter')

async function tryImport(path: string): Promise<any> {
  logger.verbose(`Try import ${path}`)
  try {
    const taskCls = await import(path)

    logger.verbose(`Found ${path}`)
    return taskCls.default
  } catch (e) {
    return
  }
}

export async function instantiateTask(relativePath: string): Promise<any> {
  let result
  let paths = [relativePath]
  paths = paths.concat(module.paths.map(p => join(dirname(p), relativePath)))
  for (const path of paths) {
    result = await tryImport(path)
    if (result) break
  }
  return result
}
