import { promises as fs } from 'fs';
import path from 'path';

/**
 * Check if a file exists at the given path.
 *
 * @param {string} filePath - The path to the file to check.
 * @returns {Promise<boolean>} - True if the path is a file, false otherwise.
 */
export const checkFileExists = async (filePath: string): Promise<boolean> => {
    try {
        const resolvedFilePath = path.resolve(filePath);

        const stats = await fs.stat(resolvedFilePath);

        return stats.isFile();
    } catch {
        return false;
    }
};
