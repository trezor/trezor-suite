import type {
    ChainSendAccount,
    RbfTransactionParams,
} from '@trezor/network-module-suite-common-types';
import { asNetworkSymbol } from '@trezor/network-module-types';

import { createEvmAccountNonce } from './createEvmAccountNonce';

const readNonce = jest.fn();
const getChainPendingSends = jest.fn();

const nonce = createEvmAccountNonce(
    { readNonce, getChainPendingSends },
    { symbol: asNetworkSymbol('eth'), backendType: 'blockbook' },
);

const account: ChainSendAccount = {
    symbol: asNetworkSymbol('eth'),
    descriptor: '0xabc',
    index: 0,
    path: "m/44'/60'/0'/0/0",
    accountType: 'normal',
    deviceState: 'wallet-identity',
    balance: '0',
    availableBalance: '0',
    formattedBalance: '0',
};

const pendingSend = (txid: string, sentNonce?: number) => ({
    txid,
    ...(sentNonce === undefined
        ? {}
        : { ethereumSpecific: { status: -1, nonce: sentNonce, gasLimit: 21000 } }),
});

const { signal } = new AbortController();

describe(createEvmAccountNonce.name, () => {
    beforeEach(() => {
        jest.resetAllMocks();
        getChainPendingSends.mockReturnValue([]);
    });

    it('joins the backend count with the account’s pending sends', async () => {
        readNonce.mockResolvedValue({ pendingNonce: 5, confirmedNonce: 5 });
        getChainPendingSends.mockReturnValue([pendingSend('0x2', 6), pendingSend('0x1', 5)]);

        await expect(
            nonce.getAccountNonce({
                ref: { ...account, connectionIdentity: 'wallet-identity' },
                signal,
            }),
        ).resolves.toEqual({ confirmedNonce: 5, nextNonce: 7, pendingNonces: [5, 6] });
        expect(getChainPendingSends).toHaveBeenCalledWith({
            symbol: 'eth',
            backendType: 'blockbook',
            descriptor: '0xabc',
        });
        expect(readNonce).toHaveBeenCalledWith(
            expect.objectContaining({ descriptor: '0xabc', connectionIdentity: 'wallet-identity' }),
        );
    });

    it('signs at the next nonce, read through the account’s wallet connection', async () => {
        readNonce.mockResolvedValue({ pendingNonce: 9, confirmedNonce: 8 });

        await expect(
            nonce.resolveEvmNonce({ account, fetchConfirmedNonce: true }),
        ).resolves.toEqual({ nonce: '9', confirmedNonce: '8' });
        expect(readNonce).toHaveBeenCalledWith({
            symbol: 'eth',
            descriptor: '0xabc',
            connectionIdentity: 'wallet-identity',
        });
    });

    it('keeps the nonce of a replaced transaction without reading the backend', async () => {
        await expect(
            nonce.resolveEvmNonce({
                account,
                rbfParams: {
                    type: 'ethereum',
                    txid: '0x1',
                    outputs: [],
                    ethereumNonce: 4,
                } as Partial<RbfTransactionParams> as RbfTransactionParams,
                fetchConfirmedNonce: true,
            }),
        ).resolves.toEqual({ nonce: '4', confirmedNonce: '4' });
        expect(readNonce).not.toHaveBeenCalled();
    });

    it('refuses to sign when the backend gives no nonce', async () => {
        readNonce.mockRejectedValue(new Error('offline'));

        await expect(
            nonce.resolveEvmNonce({ account, fetchConfirmedNonce: true }),
        ).rejects.toMatchObject({ code: 'sign-failed' });
    });

    it('hints the backend at the pending sends it may not see', () => {
        expect(nonce.getEvmPrivatePendingHint(account)).toBeUndefined();

        getChainPendingSends.mockReturnValue([
            pendingSend('0xb', 7),
            pendingSend('0xa', 6),
            pendingSend('0xc'),
        ]);

        expect(nonce.getEvmPrivatePendingHint(account)).toEqual({
            nonces: [6, 7],
            txids: ['0xa', '0xb'],
        });
    });
});
