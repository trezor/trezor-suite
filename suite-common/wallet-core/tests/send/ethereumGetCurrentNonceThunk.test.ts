import { configureMockStore } from '@suite-common/test-utils';
import TrezorConnect from '@trezor/connect';

import { confirmedNonces, ethAccount, evmTx } from './evmFixtures';
import { ethereumGetCurrentNonceThunk } from '../../src/send/sendFormEthereumThunks';

const storeWithTxs = (accountTransactions: ReturnType<typeof evmTx>[]) =>
    configureMockStore({
        preloadedState: {
            wallet: {
                transactions: {
                    transactions: { [ethAccount.key]: accountTransactions },
                },
            },
        },
    });

describe(ethereumGetCurrentNonceThunk.name, () => {
    beforeEach(() => {
        jest.spyOn(TrezorConnect, 'getAccountInfo').mockResolvedValue({
            success: true,
            payload: { misc: { nonce: '0' } },
        } as any);
        jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => jest.restoreAllMocks());

    it('resolves the nonce from the account transactions in the store', async () => {
        const store = storeWithTxs([...confirmedNonces(6), evmTx(13, { confirmed: false })]);

        const result = await store
            .dispatch(ethereumGetCurrentNonceThunk({ selectedAccount: ethAccount }))
            .unwrap();

        expect(result).toEqual({ nonce: '6', confirmedNonce: '6' });
    });

    it('returns zero when the account has no transactions', async () => {
        const store = storeWithTxs([]);

        const result = await store
            .dispatch(ethereumGetCurrentNonceThunk({ selectedAccount: ethAccount }))
            .unwrap();

        expect(result).toEqual({ nonce: '0', confirmedNonce: '0' });
    });
});
