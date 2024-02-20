import fs from 'fs';
import { promisify } from 'util';

const exists = promisify(fs.exists);
const mkdir = promisify(fs.mkdir);

export const ensureDirectoryExists = async (dir: string) => {
    if (!(await exists(dir))) {
        await mkdir(dir, { recursive: true });
    }

    return dir;
};
