import { TypedError } from '@trezor/connect-common/src/constants/errors';

import { TrezorBlockchain } from './TrezorBlockchain';

jest.mock('./api/getInfo', () => ({ getInfo: () => new Promise(() => {}) }));

describe('TrezorBlockchain', () => {
    it('fails a call with the reason of its aborted signal, without waiting for the backend', async () => {
        const reason = TypedError('Method_Cancel');

        await expect(
            TrezorBlockchain.getInfo({ coin: 'btc' }, { signal: AbortSignal.abort(reason) }),
        ).resolves.toEqual({
            success: false,
            error: { code: 'Method_Cancel', message: reason.message },
        });
    });
});
