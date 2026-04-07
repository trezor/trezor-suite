import { open, read, readBinary, readDir, rename, save } from '../libs/user-data';

jest.mock('electron', () => ({
    app: {
        getPath: jest.fn(() => '/tmp/user-data'),
    },
}));

jest.mock('@suite-common/suite-utils', () => ({
    isDevEnv: false,
}));

describe('user-data path traversal protection', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        global.logger = {
            error: jest.fn(),
        } as any;
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

    it('rejects file path traversal in readBinary()', async () => {
        const result = await readBinary('/metadata', '../../outside.txt');

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
