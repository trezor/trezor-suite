import fs from 'fs';

import { read, rename, save } from '../libs/user-data';

jest.mock('electron', () => ({
    app: {
        getPath: jest.fn(() => '/tmp/user-data'),
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

    it('rejects traversal in read()', async () => {
        const result = await read('/metadata', '../../outside.txt');

        expect(result).toStrictEqual({
            success: false,
            error: 'Path traversal attempt detected: "../../outside.txt"',
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
});
