import { configureMockStore } from '@suite-common/test-utils';
import TrezorConnect from '@trezor/connect';

import { type EthAccount, ethAccount, evmTx } from './__fixtures__/evmFixtures';
import { ethereumGetCurrentNonceThunk } from './sendFormEthereumThunks';

const accountWithNonce = (nonce: number): EthAccount =>
    ({ ...ethAccount, misc: { nonce: nonce.toString() } }) as EthAccount;

const storeWithTxs = (accountTransactions: ReturnType<typeof evmTx>[]) =>
    configureMockStore({
        extra: undefined,
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
            .dispatch(
                ethereumGetCurrentNonceThunk({
                    selectedAccount: accountWithNonce(6),
                    fetchConfirmedNonce: false,
                }),
            )
            .unwrap();

        expect(result).toEqual({ nonce: '6', confirmedNonce: '6' });
    });

    it('returns zero when the account has no transactions and nonce is 0', async () => {
        const store = storeWithTxs([]);

        const result = await store
            .dispatch(
                ethereumGetCurrentNonceThunk({
                    selectedAccount: accountWithNonce(0),
                    fetchConfirmedNonce: false,
                }),
            )
            .unwrap();

        expect(result).toEqual({ nonce: '0', confirmedNonce: '0' });
    });

    it('fetches the authoritative confirmed nonce from the backend when opted in', async () => {
        const getAccountInfo = jest.spyOn(TrezorConnect, 'getAccountInfo').mockResolvedValue({
            success: true,
            payload: { misc: { nonce: '10', confirmedNonce: '9' } },
        } as any);
        // Stale local account nonce (3) must be overridden by the backend confirmed nonce (9).
        const store = storeWithTxs([]);

        const result = await store
            .dispatch(
                ethereumGetCurrentNonceThunk({
                    selectedAccount: accountWithNonce(3),
                    fetchConfirmedNonce: true,
                }),
            )
            .unwrap();

        expect(getAccountInfo).toHaveBeenCalledWith(
            expect.objectContaining({ confirmedNonce: true }),
        );
        expect(result).toEqual({ nonce: '9', confirmedNonce: '9' });
    });
});
