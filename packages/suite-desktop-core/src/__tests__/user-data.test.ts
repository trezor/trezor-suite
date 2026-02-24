import { open, read, readDir, rename, save } from '../libs/user-data';

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

    it('rejects traversal in save()', async () => {
        const result = await save('/metadata', '../../../OtherApp/outside.txt', 'payload', 'utf-8');

        expect(result).toStrictEqual({
            success: false,
            error: 'Path traversal attempt detected: "../../../OtherApp/outside.txt"',
        });
    });

    it('rejects traversal in read()', async () => {
        const result = await read('/metadata', '../../outside.txt');

        expect(result).toStrictEqual({
            success: false,
            error: 'Path traversal attempt detected: "../../outside.txt"',
        });
    });

    it('rejects traversal in rename()', async () => {
        const result = await rename('/metadata', 'labels.json', '../outside.txt');

        expect(result).toStrictEqual({
            success: false,
            error: 'Path traversal attempt detected: "../outside.txt"',
        });
    });

    it('rejects traversal in readDir()', async () => {
        const result = await readDir('../../OtherApp');

        expect(result).toStrictEqual({
            success: false,
            error: 'Path traversal attempt detected: "../../OtherApp"',
        });
    });

    it('rejects traversal in open()', async () => {
        const result = await open('../../OtherApp');

        expect(result).toStrictEqual({
            success: false,
            error: 'Path traversal attempt detected: "../../OtherApp"',
        });
    });
});
