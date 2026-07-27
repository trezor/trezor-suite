import { existsSync, promises as fs } from 'fs';
import os from 'os';
import path from 'path';

import { ensureDirectoryExists } from '../ensureDirectoryExists';

describe('ensureDirectoryExists', () => {
    let baseDir: string;

    beforeEach(async () => {
        baseDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ensure-dir-'));
    });

    afterEach(async () => {
        await fs.rm(baseDir, { recursive: true, force: true });
    });

    it('creates the directory when it does not exist', async () => {
        const target = path.join(baseDir, 'nested', 'dir');
        expect(existsSync(target)).toBe(false);

        const result = await ensureDirectoryExists(target);

        expect(result).toBe(target);
        expect(existsSync(target)).toBe(true);
    });

    it('is a no-op when the directory already exists', async () => {
        const target = path.join(baseDir, 'existing');
        await fs.mkdir(target);

        const result = await ensureDirectoryExists(target);

        expect(result).toBe(target);
        expect(existsSync(target)).toBe(true);
    });

    it('throws when the target already exists as a file', async () => {
        const target = path.join(baseDir, 'existing-file');
        await fs.writeFile(target, '');

        await expect(ensureDirectoryExists(target)).rejects.toThrow();
    });
});
