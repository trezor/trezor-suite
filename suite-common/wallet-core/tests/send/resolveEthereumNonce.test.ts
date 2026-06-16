import { type RbfTransactionParams } from '@suite-common/wallet-types';
import TrezorConnect from '@trezor/connect';

import { confirmedNonces, ethAccount, evmTx } from './evmFixtures';
import { resolveEthereumNonce } from '../../src/send/sendFormEthereumThunks';

const rbf = (ethereumNonce: number) =>
    ({ type: 'ethereum', ethereumNonce }) as unknown as RbfTransactionParams;

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
            accountTransactions: confirmedNonces(3),
        });

        expect(result).toEqual({ nonce: '7', confirmedNonce: '7' });
        expect(getAccountInfo).not.toHaveBeenCalled();
    });

    it('returns 0 when there are no sent txs', async () => {
        const result = await resolveEthereumNonce({
            selectedAccount: ethAccount,
            accountTransactions: [],
        });

        expect(result).toEqual({ nonce: '0', confirmedNonce: '0' });
    });

    it('uses the confirmed count when there are no pending txs', async () => {
        // confirmed nonces 0..4 -> confirmed count 5, next 5
        const result = await resolveEthereumNonce({
            selectedAccount: ethAccount,
            accountTransactions: confirmedNonces(5),
        });

        expect(result).toEqual({ nonce: '5', confirmedNonce: '5' });
    });

    it('walks past contiguous pending txs to the next free nonce', async () => {
        const result = await resolveEthereumNonce({
            selectedAccount: ethAccount,
            accountTransactions: [
                ...confirmedNonces(5),
                evmTx(5, { confirmed: false }),
                evmTx(6, { confirmed: false }),
                evmTx(7, { confirmed: false }),
            ],
        });

        expect(result).toEqual({ nonce: '8', confirmedNonce: '5' });
    });

    it('ignores a gapped pending tx and suggests filling the gap', async () => {
        const result = await resolveEthereumNonce({
            selectedAccount: ethAccount,
            accountTransactions: [...confirmedNonces(6), evmTx(13, { confirmed: false })],
        });

        expect(result).toEqual({ nonce: '6', confirmedNonce: '6' });
    });

    it('ignores received transactions', async () => {
        const result = await resolveEthereumNonce({
            selectedAccount: ethAccount,
            accountTransactions: [
                ...confirmedNonces(3),
                evmTx(99, { confirmed: false, type: 'recv' }),
            ],
        });

        expect(result).toEqual({ nonce: '3', confirmedNonce: '3' });
    });

    it('still derives locally when the backend fetch fails', async () => {
        getAccountInfo.mockResolvedValue({ success: false } as any);

        const result = await resolveEthereumNonce({
            selectedAccount: ethAccount,
            accountTransactions: confirmedNonces(5),
        });

        expect(result).toEqual({ nonce: '5', confirmedNonce: '5' });
    });

    it('prefers the backend confirmed nonce when blockbook provides it', async () => {
        // backend reports confirmed 10; the (incomplete) local tx list would only derive 3
        getAccountInfo.mockResolvedValue({
            success: true,
            payload: { misc: { nonce: '10', confirmedNonce: '9' } },
        } as any);

        const result = await resolveEthereumNonce({
            selectedAccount: ethAccount,
            accountTransactions: confirmedNonces(3),
            fetchConfirmedNonce: true,
        });

        expect(result).toEqual({ nonce: '9', confirmedNonce: '9' });
    });
});
