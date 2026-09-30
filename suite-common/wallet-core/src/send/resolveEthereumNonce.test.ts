import { type RbfTransactionParams } from '@suite-common/wallet-types';
import TrezorConnect from '@trezor/connect';

import { type EthAccount, FOREIGN_SIGNER, ethAccount, evmTx } from './__fixtures__/evmFixtures';
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

    it('ignores a transaction the account did not sign, however it is labelled', async () => {
        // A stranger's token transfer *out of* the account is labelled 'sent' and indexed against
        // the account, but carries the stranger's nonce. Counting it offered a nonce one slot too
        // high, which cannot be mined until the skipped slot is filled.
        const result = await resolveEthereumNonce({
            selectedAccount: accountWithNonce(3),
            accountTransactions: [
                evmTx(3, { confirmed: true, signer: FOREIGN_SIGNER }),
                evmTx(4, { confirmed: false, signer: FOREIGN_SIGNER }),
            ],
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

        expect(result).toEqual({
            nonce: '9',
            confirmedNonce: '9',
            pendingNonceCeiling: 10,
            // a gap with nothing of ours in flight is, by definition, a tx we cannot see
            unknownPendingNonces: { pendingNonce: 10, confirmedNonce: 9 },
        });
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

        expect(result).toEqual({
            nonce: '1418',
            confirmedNonce: '1418',
            pendingNonceCeiling: 1418,
        });
    });

    it("prefers the response's fresh pending nonce over the stale store copy", async () => {
        // Blockbook omits confirmedNonce when only the "latest" lookup failed; the rest of the
        // response, pending nonce included, is still valid and newer than the last account sync.
        getAccountInfo.mockResolvedValue({
            success: true,
            payload: { misc: { nonce: '12' } },
        } as any);

        const result = await resolveEthereumNonce({
            selectedAccount: accountWithNonce(3),
            accountTransactions: [],
            fetchConfirmedNonce: true,
        });

        expect(result).toEqual({ nonce: '12', confirmedNonce: '12', pendingNonceCeiling: 12 });
    });

    it('retries a rejection once, then falls back to local derivation', async () => {
        getAccountInfo.mockRejectedValue(new Error('network down'));

        const result = await resolveEthereumNonce({
            selectedAccount: accountWithNonce(5),
            accountTransactions: [],
            fetchConfirmedNonce: true,
        });

        expect(getAccountInfo).toHaveBeenCalledTimes(2);
        expect(result).toEqual({ nonce: '5', confirmedNonce: '5' });
    });

    it('retries an unsuccessful response once, then falls back to local derivation', async () => {
        getAccountInfo.mockResolvedValue({
            success: false,
            error: { code: 'Method_Interrupted', message: 'interrupted' },
        } as any);

        const result = await resolveEthereumNonce({
            selectedAccount: accountWithNonce(5),
            accountTransactions: [],
            fetchConfirmedNonce: true,
        });

        expect(getAccountInfo).toHaveBeenCalledTimes(2);
        expect(result).toEqual({ nonce: '5', confirmedNonce: '5' });
    });

    it('uses the retry when only the first attempt fails, so one dropped call does not degrade signing', async () => {
        getAccountInfo.mockRejectedValueOnce(new Error('network down')).mockResolvedValue({
            success: true,
            payload: { misc: { nonce: '12', confirmedNonce: '12' } },
        } as any);

        const result = await resolveEthereumNonce({
            selectedAccount: accountWithNonce(5),
            accountTransactions: [],
            fetchConfirmedNonce: true,
        });

        expect(getAccountInfo).toHaveBeenCalledTimes(2);
        expect(result).toEqual({ nonce: '12', confirmedNonce: '12', pendingNonceCeiling: 12 });
    });

    it('does not spend the retry on a success that merely omits confirmedNonce', async () => {
        // That path is blockbook's "latest lookup failed" partial, not a failed call: the pending
        // nonce it carries is live, so a second call would buy nothing.
        getAccountInfo.mockResolvedValue({
            success: true,
            payload: { misc: { nonce: '12' } },
        } as any);

        await resolveEthereumNonce({
            selectedAccount: accountWithNonce(3),
            accountTransactions: [],
            fetchConfirmedNonce: true,
        });

        expect(getAccountInfo).toHaveBeenCalledTimes(1);
    });

    it("raises the pending ceiling by the account's own in-flight txs the node has not seen", async () => {
        getAccountInfo.mockResolvedValue({
            success: true,
            payload: { misc: { nonce: '48', confirmedNonce: '48' } },
        } as any);

        const result = await resolveEthereumNonce({
            selectedAccount: accountWithNonce(48),
            accountTransactions: [evmTx(48, { confirmed: false }), evmTx(49, { confirmed: false })],
            fetchConfirmedNonce: true,
        });

        expect(result).toEqual({ nonce: '50', confirmedNonce: '48', pendingNonceCeiling: 50 });
    });

    it('offers no ceiling when the backend returns no pending nonce, so the cross-check is skipped', async () => {
        getAccountInfo.mockResolvedValue({
            success: true,
            payload: { misc: { confirmedNonce: '9' } },
        } as any);

        const result = await resolveEthereumNonce({
            selectedAccount: accountWithNonce(3),
            accountTransactions: [],
            fetchConfirmedNonce: true,
        });

        expect(result.pendingNonceCeiling).toBeUndefined();
    });

    it('keeps the resolved nonce within the ceiling while a tx of ours is confirming', async () => {
        // The node has mined nonce 48 (pending count 49) but its mined-only count still reads 48,
        // and the local list already shows 48 confirmed. nextNonce bridges that slot to 49, so the
        // ceiling has to reach 49 too — otherwise this ordinary window warns the user.
        getAccountInfo.mockResolvedValue({
            success: true,
            payload: { misc: { nonce: '49', confirmedNonce: '48' } },
        } as any);

        const result = await resolveEthereumNonce({
            selectedAccount: accountWithNonce(48),
            accountTransactions: [evmTx(48, { confirmed: true })],
            fetchConfirmedNonce: true,
        });

        expect(result).toEqual({ nonce: '49', confirmedNonce: '48', pendingNonceCeiling: 49 });
        expect(parseInt(result.nonce, 10)).not.toBeGreaterThan(result.pendingNonceCeiling!);
    });

    it('flags in-flight txs the account cannot see, so signing can stop and ask', async () => {
        // The node's pending count runs two ahead of its mined-only count with nothing of ours in
        // flight: someone broadcast from another wallet and our next send would collide.
        getAccountInfo.mockResolvedValue({
            success: true,
            payload: { misc: { nonce: '50', confirmedNonce: '48' } },
        } as any);

        const result = await resolveEthereumNonce({
            selectedAccount: accountWithNonce(48),
            accountTransactions: [],
            fetchConfirmedNonce: true,
        });

        expect(result.unknownPendingNonces).toEqual({ pendingNonce: 50, confirmedNonce: 48 });
    });

    it("does not flag the gap when the account's own in-flight txs explain it", async () => {
        getAccountInfo.mockResolvedValue({
            success: true,
            payload: { misc: { nonce: '50', confirmedNonce: '48' } },
        } as any);

        const result = await resolveEthereumNonce({
            selectedAccount: accountWithNonce(48),
            accountTransactions: [evmTx(48, { confirmed: false }), evmTx(49, { confirmed: false })],
            fetchConfirmedNonce: true,
        });

        expect(result.unknownPendingNonces).toBeUndefined();
    });

    it("does not count a stranger's pending tx towards the ceiling", async () => {
        // The #30910 shape: a foreign tx indexed against the account must not widen the room a
        // send is allowed to claim above the node's pending nonce.
        getAccountInfo.mockResolvedValue({
            success: true,
            payload: { misc: { nonce: '48', confirmedNonce: '48' } },
        } as any);

        const result = await resolveEthereumNonce({
            selectedAccount: accountWithNonce(48),
            accountTransactions: [evmTx(48, { confirmed: false, signer: FOREIGN_SIGNER })],
            fetchConfirmedNonce: true,
        });

        expect(result).toEqual({ nonce: '48', confirmedNonce: '48', pendingNonceCeiling: 48 });
    });
});
