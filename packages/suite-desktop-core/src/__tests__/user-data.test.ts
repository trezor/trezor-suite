import fs from 'fs';
import { shell } from 'electron';

import { open, read, readDir, rename, save } from '../libs/user-data';

jest.mock('electron', () => ({
    app: {
        getPath: jest.fn(() => '/tmp/user-data'),
    },
    shell: {
        openPath: jest.fn(),
    },
}));

jest.mock('@suite-common/suite-utils', () => ({
    isDevEnv: false,
}));

jest.mock('fs', () => ({
    promises: {
        access: jest.fn(),
        writeFile: jest.fn(),
        rename: jest.fn(),
        mkdir: jest.fn(),
        readdir: jest.fn(),
    },
}));

describe('user-data path traversal protection', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        global.logger = {
            error: jest.fn(),
        } as any;
    });

    it('rejects traversal in save()', async () => {
        const result = await save('/metadata', '../../../OtherApp/outside.txt', 'payload', 'utf-8');

        expect(result).toStrictEqual({
            success: false,
            error: 'Path traversal attempt detected: "../../../OtherApp/outside.txt"',
        });
        expect(fs.promises.writeFile).not.toHaveBeenCalled();
    });

    it('rejects directory traversal in save()', async () => {
        const result = await save('../../OtherApp', 'outside.txt', 'payload', 'utf-8');

        expect(result).toStrictEqual({
            success: false,
            error: 'Path traversal attempt detected in directory: "../../OtherApp"',
        });
        expect(fs.promises.writeFile).not.toHaveBeenCalled();
    });

    it('rejects traversal in read()', async () => {
        const result = await read('/metadata', '../../outside.txt');

        expect(result).toStrictEqual({
            success: false,
            error: 'Path traversal attempt detected: "../../outside.txt"',
        });
        expect(fs.promises.access).not.toHaveBeenCalled();
    });

    it('rejects directory traversal in read()', async () => {
        const result = await read('../../OtherApp', 'outside.txt');

        expect(result).toStrictEqual({
            success: false,
            error: 'Path traversal attempt detected in directory: "../../OtherApp"',
        });
        expect(fs.promises.access).not.toHaveBeenCalled();
    });

    it('rejects traversal in rename()', async () => {
        const result = await rename('/metadata', 'labels.json', '../outside.txt');

        expect(result).toStrictEqual({
            success: false,
            error: 'Path traversal attempt detected: "../outside.txt"',
        });
        expect(fs.promises.rename).not.toHaveBeenCalled();
    });

    it('rejects directory traversal in rename()', async () => {
        const result = await rename('../../OtherApp', 'labels.json', 'labels.json');

        expect(result).toStrictEqual({
            success: false,
            error: 'Path traversal attempt detected in directory: "../../OtherApp"',
        });
        expect(fs.promises.rename).not.toHaveBeenCalled();
    });

    it('rejects directory traversal in readDir()', async () => {
        const result = await readDir('../../OtherApp');

        expect(result).toStrictEqual({
            success: false,
            error: 'Path traversal attempt detected in directory: "../../OtherApp"',
        });
        expect(fs.promises.access).not.toHaveBeenCalled();
        expect(fs.promises.readdir).not.toHaveBeenCalled();
    });

    it('rejects directory traversal in open()', async () => {
        const result = await open('../../OtherApp');

        expect(result).toStrictEqual({
            success: false,
            error: 'Path traversal attempt detected in directory: "../../OtherApp"',
        });
        expect(shell.openPath).not.toHaveBeenCalled();
    });
});
