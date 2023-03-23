import fs from 'fs';
import { promisify } from 'util';

const exists = promisify(fs.exists);
const mkdir = promisify(fs.mkdir);

export const ensureDirectoryExists = async (dir: string) => {
    const dasherizedDir = dir.replace(' ', '-');
    if (!(await exists(dasherizedDir))) {
        await mkdir(dasherizedDir, { recursive: true });
    }
    return dasherizedDir;
};
