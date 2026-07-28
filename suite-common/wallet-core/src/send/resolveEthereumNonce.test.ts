import { type RbfTransactionParams } from '@suite-common/wallet-types';
import TrezorConnect from '@trezor/connect';

import { type EthAccount, ethAccount, evmTx } from './__fixtures__/evmFixtures';
import { resolveEthereumNonce } from './sendFormEthereumThunks';

const rbf = (ethereumNonce: number) =>
    ({ type: 'ethereum', ethereumNonce }) as unknown as RbfTransactionParams;

const accountWithNonce = (nonce: number): EthAccount =>
    ({ ...ethAccount, misc: { nonce: nonce.toString() } }) as EthAccount;

describe('resolveEthereumNonce', () => {
    let getAccountInfo: jest.SpyInstance;

    beforeEach(() => {
        getAccountInfo = jest
            .spyOn(TrezorConnect, 'getAccountInfo')
            .mockResolvedValue({ success: true, payload: { misc: { nonce: '0' } } } as any);
        jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => jest.restoreAllMocks());

    it('reuses the RBF nonce and does not fetch from the backend', async () => {
        const result = await resolveEthereumNonce({
            selectedAccount: ethAccount,
            rbfParams: rbf(7),
            accountTransactions: [],
            fetchConfirmedNonce: false,
        });

        expect(result).toEqual({ nonce: '7', confirmedNonce: '7' });
        expect(getAccountInfo).not.toHaveBeenCalled();
    });

    it('returns account nonce when there are no pending txs', async () => {
        const result = await resolveEthereumNonce({
            selectedAccount: accountWithNonce(0),
            accountTransactions: [],
            fetchConfirmedNonce: false,
        });

        expect(result).toEqual({ nonce: '0', confirmedNonce: '0' });
    });

    it('uses account nonce as the confirmed nonce baseline', async () => {
        const result = await resolveEthereumNonce({
            selectedAccount: accountWithNonce(5),
            accountTransactions: [],
            fetchConfirmedNonce: false,
        });

        expect(result).toEqual({ nonce: '5', confirmedNonce: '5' });
    });

    it('walks past contiguous pending txs to the next free nonce', async () => {
        const result = await resolveEthereumNonce({
            selectedAccount: accountWithNonce(5),
            accountTransactions: [
                evmTx(5, { confirmed: false }),
                evmTx(6, { confirmed: false }),
                evmTx(7, { confirmed: false }),
            ],
            fetchConfirmedNonce: false,
        });

        expect(result).toEqual({ nonce: '8', confirmedNonce: '5' });
    });

    it('ignores a gapped pending tx and suggests filling the gap', async () => {
        const result = await resolveEthereumNonce({
            selectedAccount: accountWithNonce(6),
            accountTransactions: [evmTx(13, { confirmed: false })],
            fetchConfirmedNonce: false,
        });

        expect(result).toEqual({ nonce: '6', confirmedNonce: '6' });
    });

    it('ignores received transactions', async () => {
        const result = await resolveEthereumNonce({
            selectedAccount: accountWithNonce(3),
            accountTransactions: [evmTx(99, { confirmed: false, type: 'recv' })],
            fetchConfirmedNonce: false,
        });

        expect(result).toEqual({ nonce: '3', confirmedNonce: '3' });
    });

    it('falls back to account nonce when the backend fetch fails', async () => {
        getAccountInfo.mockResolvedValue({ success: false } as any);

        const result = await resolveEthereumNonce({
            selectedAccount: accountWithNonce(5),
            accountTransactions: [],
            fetchConfirmedNonce: true,
        });

        expect(result).toEqual({ nonce: '5', confirmedNonce: '5' });
    });

    it('prefers the backend confirmed nonce when blockbook provides it', async () => {
        getAccountInfo.mockResolvedValue({
            success: true,
            payload: { misc: { nonce: '10', confirmedNonce: '9' } },
        } as any);

        const result = await resolveEthereumNonce({
            selectedAccount: accountWithNonce(3),
            accountTransactions: [],
            fetchConfirmedNonce: true,
        });

        expect(result).toEqual({ nonce: '9', confirmedNonce: '9' });
    });

    it('trusts the backend confirmed nonce even when local tx history has a bogus/corrupted nonce', async () => {
        // Regression: a single malformed local tx record (e.g. nonce 335753) must not push a
        // trusted, backend-fetched confirmedNonce upward — that reconciliation only applies to the
        // untrusted account.misc.nonce fallback, not to a confirmedNonce the backend vouches for.
        getAccountInfo.mockResolvedValue({
            success: true,
            payload: { misc: { nonce: '1418', confirmedNonce: '1418' } },
        } as any);

        const result = await resolveEthereumNonce({
            selectedAccount: accountWithNonce(1418),
            accountTransactions: [evmTx(335753, { confirmed: true })],
            fetchConfirmedNonce: true,
        });

        expect(result).toEqual({ nonce: '1418', confirmedNonce: '1418' });
    });
});
