import { configureMockStore } from '@suite-common/test-utils';
import TrezorConnect from '@trezor/connect';

import { type EthAccount, ethAccount, evmTx } from './evmFixtures';
import { ethereumGetCurrentNonceThunk } from '../../src/send/sendFormEthereumThunks';

const accountWithNonce = (nonce: number): EthAccount =>
    ({ ...ethAccount, misc: { nonce: nonce.toString() } }) as EthAccount;

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

    it('uses account nonce and ignores a gapped pending tx', async () => {
        const store = storeWithTxs([evmTx(13, { confirmed: false })]);

        const result = await store
            .dispatch(ethereumGetCurrentNonceThunk({ selectedAccount: accountWithNonce(6) }))
            .unwrap();

        expect(result).toEqual({ nonce: '6', confirmedNonce: '6' });
    });

    it('returns zero when the account has no transactions and nonce is 0', async () => {
        const store = storeWithTxs([]);

        const result = await store
            .dispatch(ethereumGetCurrentNonceThunk({ selectedAccount: accountWithNonce(0) }))
            .unwrap();

        expect(result).toEqual({ nonce: '0', confirmedNonce: '0' });
    });
});
