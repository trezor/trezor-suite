import { asNetworkSymbol } from '@trezor/network-module-types';

import { createReadBlockbookEvmNonce, createReadEvmRpcNonce } from './readEvmNonce';

const getAccountInfo = jest.fn();
const deps = { getTrezorConnect: () => ({ getAccountInfo }) };

const account = {
    symbol: asNetworkSymbol('eth'),
    descriptor: '0xabc',
    connectionIdentity: 'wallet-identity',
};

const accountInfo = (payload: object) => ({ success: true, payload: { history: {}, ...payload } });

describe('readEvmNonce', () => {
    beforeEach(() => {
        jest.resetAllMocks();
    });

    describe(createReadBlockbookEvmNonce.name, () => {
        it('reads the pending-inclusive and the mined-only count through the wallet connection', async () => {
            getAccountInfo.mockResolvedValue(
                accountInfo({ misc: { nonce: '8', confirmedNonce: '6' } }),
            );

            await expect(createReadBlockbookEvmNonce(deps)(account)).resolves.toEqual({
                pendingNonce: 8,
                confirmedNonce: 6,
            });
            expect(getAccountInfo).toHaveBeenCalledWith({
                coin: 'eth',
                descriptor: '0xabc',
                details: 'basic',
                suppressBackupWarning: true,
                identity: 'wallet-identity',
                confirmedNonce: true,
            });
        });

        it('has no mined-only count from an older Blockbook', async () => {
            getAccountInfo.mockResolvedValue(accountInfo({ misc: { nonce: '8' } }));

            await expect(createReadBlockbookEvmNonce(deps)(account)).resolves.toEqual({
                pendingNonce: 8,
                confirmedNonce: undefined,
            });
        });

        it('never guesses a nonce the backend did not give', async () => {
            getAccountInfo.mockResolvedValue(accountInfo({ misc: {} }));

            await expect(createReadBlockbookEvmNonce(deps)(account)).rejects.toMatchObject({
                code: 'account-info-failed',
            });
        });

        it('fails without echoing the backend message', async () => {
            getAccountInfo.mockResolvedValue({
                success: false,
                payload: { error: '0xabc failed' },
            });

            await expect(createReadBlockbookEvmNonce(deps)(account)).rejects.toMatchObject({
                code: 'account-info-failed',
            });
        });
    });

    describe(createReadEvmRpcNonce.name, () => {
        it('counts the transactions waiting in the node mempool on top of the mined ones', async () => {
            getAccountInfo.mockResolvedValue(
                accountInfo({ misc: { nonce: '6' }, history: { unconfirmed: 2 } }),
            );

            await expect(createReadEvmRpcNonce(deps)(account)).resolves.toEqual({
                confirmedNonce: 6,
                pendingNonce: 8,
            });
            expect(getAccountInfo).toHaveBeenCalledWith(
                expect.objectContaining({ confirmedNonce: false, identity: 'wallet-identity' }),
            );
        });
    });
});
