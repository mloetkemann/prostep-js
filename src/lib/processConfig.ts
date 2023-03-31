export interface KeyValueConfig {
  key: string
  value: any
}

export interface TaskConfig {
  name: string
  path: string
}

export enum StepType {
  Task,
  Subprocess,
}

export interface Step {
  stepName: string
  name: string
  type: StepType
  arguments: KeyValueConfig[]
}

export interface ProcessConfig {
  name: string
  inputs: string[]
  steps: Step[]
  results: KeyValueConfig[]
}
