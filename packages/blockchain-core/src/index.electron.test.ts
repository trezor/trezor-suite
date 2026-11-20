import { TypedError } from '@trezor/connect-common/src/constants/errors';

import { TrezorBlockchain } from './index.electron';

const mockGetInfo = jest.fn();

jest.mock('@trezor/ipc-proxy', () => ({
    createIpcProxy: () => Promise.resolve({ getInfo: mockGetInfo }),
}));

describe('TrezorBlockchain of the desktop renderer', () => {
    it('ends a call when its signal aborts, sending only the params to the main process', async () => {
        const reason = TypedError('Method_Cancel');
        const abortController = new AbortController();
        // The call is cancelled while the main process reads the backend, which never answers.
        mockGetInfo.mockImplementation(() => {
            abortController.abort(reason);

            return new Promise(() => {});
        });

        await expect(
            TrezorBlockchain.getInfo({ coin: 'btc' }, { signal: abortController.signal }),
        ).resolves.toEqual({
            success: false,
            error: { code: 'Method_Cancel', message: reason.message },
        });
        expect(mockGetInfo).toHaveBeenCalledWith({ coin: 'btc' });
    });
});
