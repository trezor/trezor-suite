import fs from 'fs';
import { promisify } from 'util';

import { ensureDirectoryExists } from '../ensureDirectoryExists';

const exists = promisify(fs.exists);

describe('ensureDirectoryExists', () => {
    it('if the files does not exist it creates it', async () => {
        const directoryToCreate = './tmp/test';
        const directory = await ensureDirectoryExists(directoryToCreate);

        expect(directory).toBeTruthy();
        expect(await exists(directory)).toBeTruthy();
    });
});
