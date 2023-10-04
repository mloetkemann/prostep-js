import { ExecutableRuntimeContextBase } from './base'

export default class ProcessRuntimeContext extends ExecutableRuntimeContextBase {
  constructor(entries?: [string, any][]) {
    super(new Map<string, unknown>(entries), new Map<string, unknown>())
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  progress(value: number): void {}
}
