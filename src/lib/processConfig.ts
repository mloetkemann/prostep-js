export interface KeyValueConfig {
  key: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any
}

export interface FieldMetaData {
  name: string
  type: string
  options?: Map<string, unknown>
  required?: boolean
}

export interface InputMetadata {
  fields: FieldMetaData[]
}

export interface TaskConfig {
  name: string
  path: string
}

export interface Step {
  stepName: string
  name: string
  type: string
  arguments: KeyValueConfig[]
}

export interface ProcessConfig {
  name: string
  constants?: KeyValueConfig[]
  inputs: InputMetadata
  steps: Step[]
  results: KeyValueConfig[]
}
