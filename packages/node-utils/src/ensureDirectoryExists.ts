import { promises as fs } from 'fs';

export const ensureDirectoryExists = async (dir: string) => {
    // With `recursive: true`, mkdir creates missing directories and does not
    // throw when the target already exists as a directory.
    await fs.mkdir(dir, { recursive: true });

    return dir;
};
