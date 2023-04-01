export interface KeyValueConfig {
  key: string
  value: any
}

export interface FieldMetaData {
  name: string
  type: string
  options?: Map<string, unknown>
}

export interface InputMetadata {
  fields: FieldMetaData[]
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
  constants?: KeyValueConfig[]
  inputs: InputMetadata
  steps: Step[]
  results: KeyValueConfig[]
}
