import fs from 'fs/promises'
import FileSystemTaskBase from './filesystemTaskBase.js'

export default class FileSystemDeleteTask extends FileSystemTaskBase {
  protected async doFileOperation(path: string): Promise<void> {
    if (await fs.stat(path)) await fs.unlink(path)
  }
}
