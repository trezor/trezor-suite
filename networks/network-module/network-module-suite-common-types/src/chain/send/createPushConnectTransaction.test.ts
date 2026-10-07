import { asNetworkSymbol } from '@trezor/network-module-types';

import type { ChainSendAccount } from './ChainSend';
import { ChainSendError } from './ChainSendError';
import { createPushConnectTransaction } from './createPushConnectTransaction';

const mockPushTransaction = jest.fn();

const push = createPushConnectTransaction({
    getTrezorConnect: () => ({ pushTransaction: mockPushTransaction }),
});

const account: ChainSendAccount = {
    symbol: asNetworkSymbol('eth'),
    descriptor: '0xconfidential',
    path: "m/44'/60'/0'/0/0",
    accountType: 'normal',
    deviceState: 'wallet-identity',
    balance: '1',
    availableBalance: '1',
    formattedBalance: '0.000000000000000001',
};

const pushParams = {
    account,
    serializedTx: '0xsigned',
    isMevProtectionEnabled: true,
    useConnectionIdentity: true,
};

describe('createPushConnectTransaction', () => {
    beforeEach(() => {
        mockPushTransaction.mockReset();
    });

    it('pushes the signed transaction through the wallet connection and returns the txid', async () => {
        mockPushTransaction.mockResolvedValue({ success: true, payload: { txid: '0xtxid' } });

        await expect(push(pushParams)).resolves.toEqual({ txid: '0xtxid' });
        expect(mockPushTransaction).toHaveBeenCalledWith({
            tx: '0xsigned',
            coin: 'eth',
            identity: 'wallet-identity',
        });
    });

    it('keeps the transaction off the alternative RPC without MEV protection', async () => {
        mockPushTransaction.mockResolvedValue({ success: true, payload: { txid: '0xtxid' } });

        await push({ ...pushParams, isMevProtectionEnabled: false, useConnectionIdentity: false });

        expect(mockPushTransaction).toHaveBeenCalledWith({
            tx: { hex: '0xsigned', disableAlternativeRPC: true },
            coin: 'eth',
            identity: undefined,
        });
    });

    it.each([
        ['tx already known', 'push-failed'],
        ['could not replace existing tx', 'push-pending-conflict'],
    ])('reports "%s" as %s with the backend message', async (message, code) => {
        mockPushTransaction.mockResolvedValue({
            success: false,
            payload: { error: message, code: 'Method_PushTransaction' },
            error: { message, code: 'Method_PushTransaction' },
        });

        const error = await push(pushParams).catch((e: unknown) => e);

        expect(error).toBeInstanceOf(ChainSendError);
        expect(error).toMatchObject({
            code,
            symbol: 'eth',
            message,
            connectErrorCode: 'Method_PushTransaction',
        });
    });
});
