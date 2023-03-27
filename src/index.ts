import { ProcessConfig, TaskConfig } from "./lib/processConfig";
import { Process } from "./lib/processRuntime";


export default class ProStepJS {

    private static inst: ProStepJS;
    private process: Process | undefined;
    
    private constructor() {
        
    }

    public async loadConfigFromFile(filePath: string) {

    }

    public async loadConfig(processConfig: ProcessConfig, taskConfig: TaskConfig[]) {
        this.process = new Process(processConfig, taskConfig);
        await this.process.init();
    }

    public async run(args : object) : Promise<any> {
        if(this.process) {
            const keyValue = Object.entries(args);
            const context = {
                input: new Map<string, any>(keyValue),
                result: new Map<string, any>()
            };
            await this.process.run(context);
            const result = Object.fromEntries(context.result);
            return result;
            
        }else{
            throw Error('Process not initialized. Please load configuration first.');
        }
        return {}
    }

    public static getProStepJS() {
        ProStepJS.inst = new ProStepJS();
        return ProStepJS.inst;
    }

}
