/* eslint-disable @typescript-eslint/no-explicit-any */
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import Logger from './logger.js'

const logger = Logger.getLogger('TaskImporter')

async function tryImport(path: string): Promise<any> {
  logger.verbose(`Try import ${path}`)
  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const taskCls = await import(path)

    logger.verbose(`Found ${path}`)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
    return taskCls.default
  } catch (e) {
    logger.verbose(`Wrong path: ${path}`)
  }
}

export async function instantiateTask(relativePath: string): Promise<any> {
  let result
  let paths = ['']
  paths = paths.concat(dirname(fileURLToPath(import.meta.url)))
  paths = paths.concat(process.cwd())
  paths = paths.map(p => join(p, relativePath))
  for (const path of paths) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    result = await tryImport(path)
    if (result) break
  }
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return result
}
