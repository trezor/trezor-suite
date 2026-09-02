import { readFileSync } from 'node:fs';

/** Read and parse a JSON file. Throws if the file is missing or contains invalid JSON. */
export const readJson = <T>(filePath: string): T =>
    JSON.parse(readFileSync(filePath, 'utf-8')) as T;
