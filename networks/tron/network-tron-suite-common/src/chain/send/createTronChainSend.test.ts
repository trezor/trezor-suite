import type { DeviceUniquePath } from '@trezor/connect-common';
import {
    type ChainComposeContext,
    type ChainSendAccount,
    type ChainSendDraft,
    ChainSendError,
    type ChainSignOptions,
    type PrecomposedTransactionFinal,
} from '@trezor/network-module-suite-common-types';
import { asNetworkSymbol } from '@trezor/network-module-types';

import { createTronChainSend } from './createTronChainSend';

const OWNER = 'TN3W4H6rK2ce4vX9YnFQHwKENnHjoxb3m9';
const RECIPIENT = 'TVDGpn4hCSzJ5nkHPLetk8KQBtwaTppnkr';
const USDT = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';

const connect = {
    getAccountInfo: jest.fn(),
    blockchainEstimateFee: jest.fn(),
    blockchainGetInfo: jest.fn(),
    tronComposeTransaction: jest.fn(),
    tronSignTransaction: jest.fn(),
    pushTransaction: jest.fn(),
};

const send = createTronChainSend({ getTrezorConnect: () => connect })(asNetworkSymbol('trx'));

const account: ChainSendAccount = {
    symbol: asNetworkSymbol('trx'),
    descriptor: OWNER,
    path: "m/44'/195'/0'/0/0",
    accountType: 'normal',
    deviceState: 'wallet-identity',
    balance: '100000000',
    availableBalance: '100000000',
    formattedBalance: '100',
    tokens: [{ standard: 'TRC20', contract: USDT, decimals: 6, balance: '50' }],
    misc: { tronResources: { availableStakedBandwidth: 0, availableFreeBandwidth: 5000 } },
};

const draft = (output: Partial<ChainSendDraft['outputs'][number]> = {}): ChainSendDraft => ({
    outputs: [
        {
            type: 'payment',
            address: RECIPIENT,
            amount: '1',
            fiat: '',
            currency: { value: 'usd', label: 'USD' },
            token: null,
            ...output,
        },
    ],
    feePerUnit: '',
    feeLimit: '',
    options: [],
    isCoinControlEnabled: false,
    selectedUtxos: [],
});

const context: ChainComposeContext = {
    feeInfo: { blockHeight: 1, blockTime: 3, minFee: 1, maxFee: 1, minPriorityFee: 0, levels: [] },
};

const signOptions: ChainSignOptions = {
    device: { path: 'device-path' as DeviceUniquePath, instance: 1 },
};

describe('createTronChainSend', () => {
    beforeEach(() => {
        jest.resetAllMocks();
        connect.tronComposeTransaction.mockResolvedValue({
            success: true,
            payload: { bandwidth: 300 },
        });
        connect.getAccountInfo.mockResolvedValue({
            success: true,
            payload: { empty: false, misc: { tronResources: { totalFreeBandwidth: 600 } } },
        });
    });

    it('composes a TRX transfer the account bandwidth covers for free', async () => {
        const { normal } = await send.composeFeeLevels({ account, draft: draft(), context });

        expect(connect.tronComposeTransaction).toHaveBeenCalledWith(
            expect.objectContaining({ blockHash: '0'.repeat(64), blockHeight: 0 }),
        );
        expect(connect.getAccountInfo).toHaveBeenCalledWith({
            coin: 'trx',
            identity: 'wallet-identity',
            descriptor: RECIPIENT,
        });
        expect(normal).toMatchObject({ type: 'final', fee: '0', totalSpent: '1000000' });
    });

    it('prices a TRC-20 transfer by the energy the backend estimates', async () => {
        connect.blockchainEstimateFee.mockResolvedValue({
            success: true,
            payload: { levels: [{ feePerTx: '13000000', feePerUnit: '100', feeLimit: '130000' }] },
        });

        const { normal } = await send.composeFeeLevels({
            account,
            draft: draft({ token: USDT }),
            context,
        });

        expect(connect.blockchainEstimateFee).toHaveBeenCalledWith(
            expect.objectContaining({
                coin: 'trx',
                identity: 'wallet-identity',
                request: expect.objectContaining({
                    specific: expect.objectContaining({ from: OWNER, to: USDT }),
                }),
            }),
        );
        expect(normal).toMatchObject({
            type: 'final',
            fee: '13000000',
            estimatedFeeLimit: '13000000',
            totalSpent: '1000000',
        });
    });

    it('reports a failed energy estimate as a fee estimation failure', async () => {
        connect.blockchainEstimateFee.mockResolvedValue({
            success: false,
            error: { message: 'estimate failed' },
        });

        await expect(
            send.composeFeeLevels({ account, draft: draft({ token: USDT }), context }),
        ).rejects.toMatchObject({ code: 'fee-estimation-failed', message: 'estimate failed' });
    });

    it('signs on the latest block and returns the serialized transaction', async () => {
        connect.blockchainGetInfo.mockResolvedValue({
            success: true,
            payload: { blockHash: 'hash', blockHeight: 42 },
        });
        connect.tronComposeTransaction.mockResolvedValue({
            success: true,
            payload: { ref_block_bytes: 'b', ref_block_hash: 'h', expiration: 2, timestamp: 1 },
        });
        connect.tronSignTransaction.mockResolvedValue({
            success: true,
            payload: { serializedTx: 'signed' },
        });

        const signed = await send.sign({
            account,
            draft: draft(),
            precomposed: { fee: '0' } as PrecomposedTransactionFinal,
            options: signOptions,
        });

        expect(signed).toEqual({ serializedTx: 'signed' });
        expect(connect.blockchainGetInfo).toHaveBeenCalledWith({
            coin: 'trx',
            identity: 'wallet-identity',
        });
        expect(connect.tronComposeTransaction).toHaveBeenCalledWith(
            expect.objectContaining({ blockHash: 'hash', blockHeight: 42, fee_limit: undefined }),
        );
        expect(connect.tronSignTransaction).toHaveBeenCalledWith(
            expect.objectContaining({
                device: signOptions.device,
                path: account.path,
                ref_block_bytes: 'b',
                expiration: 2,
            }),
        );
    });

    it('keeps the device outcome of a failed signing for the app', async () => {
        connect.blockchainGetInfo.mockResolvedValue({
            success: true,
            payload: { blockHash: 'hash', blockHeight: 42 },
        });
        connect.tronComposeTransaction.mockResolvedValue({ success: true, payload: {} });
        connect.tronSignTransaction.mockResolvedValue({
            success: false,
            error: { message: 'tx-cancelled', code: 'Method_Cancel' },
        });

        const error = await send
            .sign({
                account,
                draft: draft(),
                precomposed: { fee: '0' } as PrecomposedTransactionFinal,
                options: signOptions,
            })
            .catch((e: unknown) => e);

        expect(error).toBeInstanceOf(ChainSendError);
        expect(error).toMatchObject({
            code: 'sign-failed',
            message: 'tx-cancelled',
            connectErrorCode: 'Method_Cancel',
        });
    });
});
