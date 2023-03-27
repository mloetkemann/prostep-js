import { ExecutableRuntimeContext, TaskBase } from "./processRuntime";

export default class ExampleTask extends TaskBase {

    async run(context: ExecutableRuntimeContext) {
       let value1 = parseInt(context.input.get('value1'));
       let value2 = parseInt(context.input.get('value2'));
        
       if(value1 && value2) {
          let result = value1 + value2;
          this.logger.info(`Calculate ${value1} + ${value2} = ${result}`);
          context.result.set("result", result);
       }
 
    }
 }