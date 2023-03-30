import { join, dirname } from "path";
import { access, constants } from 'node:fs';
import Logger from "./logger";

const logger = Logger.getLogger("TaskImporter");

async function tryImport(path: string): Promise<any> {
    logger.verbose(`Try import ${path}`);
    const taskCls = await import(path);
    logger.verbose(`Found ${path}`);
    return taskCls.default;
}

export function instantiateTask(relativePath: string): Promise<any> {

        let paths = [relativePath];
        paths = paths.concat(module.paths);
        const accessPromises = paths.map(p => {
            let path = join(dirname(p), relativePath);
            return tryImport(path);
        });
        return Promise.any(accessPromises);
}