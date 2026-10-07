import type { DeviceUniquePath } from '@trezor/connect-common';
import type {
    ChainComposeContext,
    ChainSendAccount,
    ChainSendDraft,
    PrecomposedTransactionFinal,
} from '@trezor/network-module-suite-common-types';
import { asNetworkSymbol } from '@trezor/network-module-types';

import { createEthereumChainSend } from './createEthereumChainSend';

const RECIPIENT = '0x0000000000000000000000000000000000000001';

const connect = {
    blockchainEstimateFee: jest.fn(),
    ethereumSignTransaction: jest.fn(),
    pushTransaction: jest.fn(),
};
const getEvmPrivatePendingHint = jest.fn();
const resolveEvmNonce = jest.fn();
const onEvmFeeEstimationFailed = jest.fn();

const send = createEthereumChainSend({
    getTrezorConnect: () => connect,
    isApprovalFlowSupported: () => true,
    getEvmPrivatePendingHint,
    resolveEvmNonce,
    onEvmFeeEstimationFailed,
})(asNetworkSymbol('eth'));

const account: ChainSendAccount = {
    symbol: asNetworkSymbol('eth'),
    descriptor: '0xsender',
    index: 0,
    path: "m/44'/60'/0'/0/0",
    accountType: 'normal',
    deviceState: 'wallet-identity',
    balance: '1000000000000000000',
    availableBalance: '1000000000000000000',
    formattedBalance: '1',
    misc: { nonce: '6' },
};

const draft = (overrides: Partial<ChainSendDraft> = {}): ChainSendDraft => ({
    outputs: [
        {
            type: 'payment',
            address: RECIPIENT,
            amount: '0.1',
            fiat: '',
            currency: { value: 'usd', label: 'USD' },
            token: null,
        },
    ],
    feePerUnit: '',
    feeLimit: '',
    options: [],
    isCoinControlEnabled: false,
    selectedUtxos: [],
    ...overrides,
});

const context: ChainComposeContext = {
    feeInfo: {
        blockHeight: 1,
        blockTime: 12,
        minFee: 1,
        maxFee: 100,
        minPriorityFee: 0,
        levels: [{ label: 'normal', feePerUnit: '10', blocks: -1 }],
    },
};

const signOptions = { device: { path: 'device' as DeviceUniquePath } };

describe('createEthereumChainSend', () => {
    beforeEach(() => {
        jest.resetAllMocks();
    });

    it('estimates gas through the wallet connection, declaring its own pending sends', async () => {
        getEvmPrivatePendingHint.mockReturnValue({ nonces: [6] });
        connect.blockchainEstimateFee.mockResolvedValue({
            success: true,
            payload: { levels: [{ feeLimit: '21000' }] },
        });

        const { normal } = await send.composeFeeLevels({ account, draft: draft(), context });

        expect(connect.blockchainEstimateFee).toHaveBeenCalledWith({
            coin: 'eth',
            identity: 'wallet-identity',
            request: {
                blocks: [2],
                specific: {
                    from: '0xsender',
                    to: RECIPIENT,
                    value: '0x16345785d8a0000',
                    data: '',
                    privatePending: { nonces: [6] },
                },
            },
        });
        expect(normal).toMatchObject({
            type: 'final',
            feeLimit: '21000',
            estimatedFeeLimit: '21000',
            fee: '210000000000000',
        });
    });

    it('falls back to the backup gas limit and reports a failed estimate', async () => {
        connect.blockchainEstimateFee.mockResolvedValue({
            success: false,
            error: { message: 'estimate failed', code: 'Method_Interrupted' },
        });

        const { normal } = await send.composeFeeLevels({ account, draft: draft(), context });

        expect(normal).toMatchObject({ feeLimit: '50000' });
        expect(onEvmFeeEstimationFailed).toHaveBeenCalledWith(
            expect.objectContaining({
                estimateTarget: RECIPIENT,
                error: { message: 'estimate failed', code: 'Method_Interrupted' },
            }),
        );
    });

    it('signs at the resolved nonce and tells the app before the device asks', async () => {
        resolveEvmNonce.mockResolvedValue({ nonce: '7', confirmedNonce: '6' });
        connect.ethereumSignTransaction.mockResolvedValue({
            success: true,
            payload: { serializedTx: '0xsigned' },
        });
        const onPrepared = jest.fn();

        const signed = await send.sign({
            account,
            draft: draft(),
            precomposed: {
                feeLimit: '21000',
                feePerByte: '10',
            } as PrecomposedTransactionFinal,
            options: { ...signOptions, onPrepared },
        });

        expect(resolveEvmNonce).toHaveBeenCalledWith({
            account,
            rbfParams: undefined,
            fetchConfirmedNonce: true,
        });
        expect(onPrepared).toHaveBeenCalledWith({ nonce: '7' });
        expect(connect.ethereumSignTransaction).toHaveBeenCalledWith(
            expect.objectContaining({
                path: account.path,
                transaction: expect.objectContaining({ chainId: 1, nonce: '0x7', to: RECIPIENT }),
            }),
        );
        expect(signed).toEqual({ serializedTx: '0xsigned', nonce: '7' });
    });

    it('refuses a custom nonce below the confirmed one before the device asks', async () => {
        resolveEvmNonce.mockResolvedValue({ nonce: '7', confirmedNonce: '6' });

        await expect(
            send.sign({
                account,
                draft: draft({ ethereumNonce: '5' }),
                precomposed: { feeLimit: '21000', feePerByte: '10' } as PrecomposedTransactionFinal,
                options: signOptions,
            }),
        ).rejects.toMatchObject({ code: 'sign-failed' });
        expect(connect.ethereumSignTransaction).not.toHaveBeenCalled();
    });

    it('broadcasts through the wallet connection', async () => {
        connect.pushTransaction.mockResolvedValue({ success: true, payload: { txid: '0xtx' } });

        await send.push({ account, serializedTx: '0xsigned', isMevProtectionEnabled: true });

        expect(connect.pushTransaction).toHaveBeenCalledWith({
            tx: '0xsigned',
            coin: 'eth',
            identity: 'wallet-identity',
        });
    });
});
