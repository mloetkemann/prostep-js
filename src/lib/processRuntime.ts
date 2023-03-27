import Logger from "./logger";
import { ProcessConfig, Step, TaskConfig, StepType } from "./processConfig";

export interface KeyValue {
    key: string;
    value: any;
}

export interface Executable {
    init(): Promise<void>;
    getResults(): Map<string, any> | undefined;
    getName(): string;
    getConfig(): Step;
    run(context: ExecutableRuntimeContext): Promise<void>;
}

export interface ExecutableRuntimeContext {
    input: Map<string, any>;
    result: Map<string, any>;
}

export class TaskBase implements Executable {

    protected logger: Logger;
    protected results: Map<string, any> | undefined;

    static async getInstance(stepConfig: Step, taskConfig: TaskConfig) : Promise<Executable>{
        const  mod = await import(taskConfig.path);
        const taskCls = mod.default; 
        return new taskCls(stepConfig, taskConfig);
    }

    constructor(protected stepConfig: Step, protected taskConfig: TaskConfig) {

        this.logger = Logger.getLogger(`task:${stepConfig.stepName}`);

    }
    getConfig(): Step {
        return this.stepConfig;
    }

    init(): Promise<void> {
        throw new Error("Method not implemented.");
    }

    getResults(): Map<string, any> | undefined {
        
        return this.results;
    }
    getName(): string {
        return this.stepConfig.name
    }
    async run(context: ExecutableRuntimeContext): Promise<void> {
        throw new Error("Method not implemented.");
    }

}

export class Process implements Executable {

    protected results: Map<string, any> | undefined;
    private variables = new Map<string, any>();
    private steps = Array<Executable>();
    protected logger: Logger;

    constructor(private processConfig: ProcessConfig, private taskConfig: TaskConfig[]) {
        this.logger = Logger.getLogger(`process:${processConfig.name}`);
    }

    getConfig(): Step {
        throw new Error("Method not implemented.");
    }

    private async instantiateStep(step: Step): Promise<Executable> {
        this.logger.info(`Init Step ${step.stepName}`);
        if(step.type === StepType.Task) {
            try{
                const config = this.taskConfig.find(item => item.name === step.name);
                if(config) {
                    return TaskBase.getInstance(step, config);
                }
                
                
            }catch(e) {
                console.log(e);
                throw e
            }
        }
        throw Error(`Task Definition of ${step.name} not found`);
  
    }

    async init() {
        this.logger.info(`Init Process ${this.getName()}`);
        this.steps = await Promise.all(this.processConfig.steps.map(async (item) => {

            const step = await this.instantiateStep(item);
            return step;
        }));
    }

    getResults(): Map<string, any> | undefined{
        return this.results;
    }

    public getName(): string {
        return this.processConfig.name;
    }

    private mapContext(from: Map<string, any>, to: Map<string, any>, prefix: string) {
        let value = from.forEach((value, key, map) => {
            let newKey = `${prefix}:${key}`;
            to.set(newKey, value);
        });
    }

    private replaceParameter(value: string) : any{
        const re = /\$\{([a-z0-9]*:[a-z0-9]*)\}/i // RegExp for ${input:a)}
        const match = value.match(re);
        if(match) {
            const key = match[1];
            return this.variables.get(key);
        }
        return value;
    }

    private getArgumentValue(value: any):any {

        if( typeof value === 'string') {
            return this.replaceParameter(value.toString());
        }
        return value;
    }

    async run(context: ExecutableRuntimeContext): Promise<void> {
        this.logger.info(`Run Process`);
        this.mapContext(context.input, this.variables, 'input');
        
        for(let i = 0; i < this.steps.length; i++) {
            let step = this.steps[i];
            const stepContext = {
                input: new Map<string, any>(),
                result: new Map<string, any>(),
            };

            const stepConfig = step.getConfig();
            stepConfig.arguments.forEach(args => {
                stepContext.input.set(args.key, this.getArgumentValue(args.value));
            })

            this.logger.info(`Start Step ${i}: ${stepConfig.stepName}`);
            await step.run(stepContext);
            this.logger.info(`Finish Step ${i}: ${stepConfig.stepName}`);

            this.mapContext(stepContext.result, this.variables, stepConfig.stepName);
            this.processConfig.results.forEach(resultConfig => {
                context.result.set(resultConfig.key, this.getArgumentValue(resultConfig.value));
            });
            this.results = context.result;
            this.logger.info(`Finish Process`);
        }
   
    }

}