import fs from 'fs';
import path from 'path';

import {
    clearAppData,
    open,
    read,
    readDir,
    rename,
    resolveDirectoryInUserDataDir,
    resolvePathInUserDataDir,
    save,
} from './user-data';

jest.mock('electron', () => ({
    app: {
        getPath: jest.fn(() => '/tmp/user-data'),
    },
}));

jest.mock('@suite-common/suite-utils', () => ({
    isDevEnv: false,
}));

describe('resolveDirectoryInUserDataDir', () => {
    it('resolves a directory inside the user data directory', () => {
        const metadataResult = resolveDirectoryInUserDataDir('metadata');

        expect(metadataResult).toStrictEqual({
            success: true,
            payload: {
                dir: path.resolve('/tmp/user-data', 'metadata'),
            },
        });

        const rootDirResult = resolveDirectoryInUserDataDir('');

        expect(rootDirResult).toStrictEqual({
            success: true,
            payload: {
                dir: path.resolve('/tmp/user-data'),
            },
        });
    });

    it('rejects directory path traversal', () => {
        const result = resolveDirectoryInUserDataDir('../../OtherApp');

        expect(result).toStrictEqual({
            success: false,
            error: 'Path traversal attempt detected, directory: "../../OtherApp"',
        });
    });

    it('rejects directory path traversal partially matching the user-data path', () => {
        const result = resolveDirectoryInUserDataDir('../user-data-but-now-different');

        expect(result).toStrictEqual({
            success: false,
            error: 'Path traversal attempt detected, directory: "../user-data-but-now-different"',
        });
    });
});

describe('resolvePathInUserDataDir', () => {
    it('resolves a file inside the user data directory', () => {
        const metadataResult = resolvePathInUserDataDir('metadata', 'labels.json');

        expect(metadataResult).toStrictEqual({
            success: true,
            payload: {
                dir: path.resolve('/tmp/user-data', 'metadata'),
                file: path.resolve('/tmp/user-data', 'metadata', 'labels.json'),
            },
        });

        const rootDirResult = resolvePathInUserDataDir('', 'labels.json');

        expect(rootDirResult).toStrictEqual({
            success: true,
            payload: {
                dir: path.resolve('/tmp/user-data'),
                file: path.resolve('/tmp/user-data', 'labels.json'),
            },
        });
    });

    it('rejects directory path traversal', () => {
        const result = resolvePathInUserDataDir('../../OtherApp', 'labels.json');

        expect(result).toStrictEqual({
            success: false,
            error: 'Path traversal attempt detected, directory: "../../OtherApp"',
        });
    });

    it('rejects file path traversal', () => {
        const result = resolvePathInUserDataDir('metadata', '../outside.txt');

        expect(result).toStrictEqual({
            success: false,
            error: 'Path traversal attempt detected, file: "../outside.txt"',
        });
    });
});

describe('user-data path traversal protection', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        global.logger = {
            error: jest.fn(),
        } as any;
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('rejects file path traversal in save()', async () => {
        const result = await save('/metadata', '../../../OtherApp/outside.txt', 'payload', 'utf-8');

        expect(result).toStrictEqual({
            success: false,
            error: 'Path traversal attempt detected, file: "../../../OtherApp/outside.txt"',
        });
    });

    it('rejects directory and file path traversal in save()', async () => {
        const result = await save('../../metadata', '../outside.txt', 'payload', 'utf-8');

        expect(result).toStrictEqual({
            success: false,
            error: 'Path traversal attempt detected, directory: "../../metadata"',
        });
    });

    it('rejects file path traversal in read()', async () => {
        const result = await read('/metadata', '../../outside.txt');

        expect(result).toStrictEqual({
            success: false,
            error: 'Path traversal attempt detected, file: "../../outside.txt"',
        });
    });

    it('rejects file path traversal in rename()', async () => {
        const result = await rename('/metadata', 'labels.json', '../outside.txt');

        expect(result).toStrictEqual({
            success: false,
            error: 'Path traversal attempt detected, file: "../outside.txt"',
        });
    });

    it('rejects directory path traversal in readDir()', async () => {
        const result = await readDir('../../OtherApp');

        expect(result).toStrictEqual({
            success: false,
            error: 'Path traversal attempt detected, directory: "../../OtherApp"',
        });
    });

    it('allows reading user data root directory', async () => {
        const result = await readDir('');

        expect(result.success).toBe(true);
    });

    it('rejects directory path traversal in open()', async () => {
        const result = await open('../../OtherApp');

        expect(result).toStrictEqual({
            success: false,
            error: 'Path traversal attempt detected, directory: "../../OtherApp"',
        });
    });
});

describe('clearAppData', () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('removes user data directory', async () => {
        const rmSpy = jest.spyOn(fs.promises, 'rm').mockResolvedValue();

        const result = await clearAppData();

        expect(result).toStrictEqual({ success: true });
        expect(rmSpy).toHaveBeenCalledWith('/tmp/user-data', {
            recursive: true,
            force: true,
        });
    });
});
