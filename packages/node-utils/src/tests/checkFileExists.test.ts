import fs from 'fs';
import path from 'path';

import { checkFileExists } from '../checkFileExists';

const existingFilePath = path.join(__dirname, 'test-file.txt');
const nonExistingFilePath = path.join(__dirname, 'non-existing-file.txt');
const directoryPath = path.join(__dirname, 'test-directory');

beforeAll(async () => {
    await fs.promises.writeFile(existingFilePath, 'Test content');
});

afterAll(async () => {
    try {
        await fs.promises.unlink(existingFilePath);
    } catch (error) {
        console.error(error);
    }
    try {
        await fs.promises.rmdir(directoryPath);
    } catch (error) {
        console.error(error);
    }
});

describe('checkFileExists', () => {
    it('should return true for an existing file', async () => {
        const exists = await checkFileExists(existingFilePath);
        expect(exists).toBe(true);
    });

    it('should return false for a non-existing file', async () => {
        const exists = await checkFileExists(nonExistingFilePath);
        expect(exists).toBe(false);
    });

    it('should return false for a directory path', async () => {
        await fs.promises.mkdir(directoryPath);
        const exists = await checkFileExists(directoryPath);
        expect(exists).toBe(false);
    });

    it('should handle invalid paths gracefully', async () => {
        const invalidPath = path.join(__dirname, 'invalid-path', 'file.txt');
        const exists = await checkFileExists(invalidPath);
        expect(exists).toBe(false);
    });
});
