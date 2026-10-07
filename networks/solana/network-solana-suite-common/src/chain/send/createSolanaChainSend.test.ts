import type { DeviceUniquePath } from '@trezor/connect-common';
import type {
    ChainComposeContext,
    ChainSendAccount,
    ChainSendDraft,
    PrecomposedTransactionFinal,
} from '@trezor/network-module-suite-common-types';
import { asNetworkSymbol } from '@trezor/network-module-types';

import { createSolanaChainSend } from './createSolanaChainSend';

const RECIPIENT = 'ETxHeBBcuw9Yu4dGuP3oXrD12V5RECvmi8ogQ9PkjyVF';

const connect = {
    solanaComposeTransaction: jest.fn(),
    blockchainEstimateFee: jest.fn(),
    blockchainGetInfo: jest.fn(),
    solanaSignTransaction: jest.fn(),
    pushTransaction: jest.fn(),
};

const send = createSolanaChainSend({
    getTrezorConnect: () => connect,
    getSolanaBlockInfo: () => ({ blockHash: 'known-hash', blockHeight: 100 }),
})(asNetworkSymbol('sol'));

const account: ChainSendAccount = {
    symbol: asNetworkSymbol('sol'),
    descriptor: 'SenderAddress',
    index: 0,
    path: "m/44'/501'/0'/0'",
    accountType: 'normal',
    deviceState: 'wallet-identity',
    balance: '2000000000',
    availableBalance: '2000000000',
    formattedBalance: '2',
    misc: { rent: 890880 },
};

const draft = (overrides: Partial<ChainSendDraft> = {}): ChainSendDraft => ({
    outputs: [
        {
            type: 'payment',
            address: RECIPIENT,
            amount: '1',
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
        blockTime: 1,
        minFee: 1,
        maxFee: 1,
        minPriorityFee: 0,
        levels: [
            { label: 'normal', feePerUnit: '1', feePerTx: '5000', feeLimit: '200000', blocks: -1 },
        ],
    },
};

describe('createSolanaChainSend', () => {
    beforeEach(() => {
        jest.resetAllMocks();
        connect.solanaComposeTransaction.mockResolvedValue({
            success: true,
            payload: { serializedTx: 'message', additionalInfo: {} },
        });
        connect.blockchainEstimateFee.mockResolvedValue({
            success: true,
            payload: { levels: [{ feePerTx: '7000', feePerUnit: '10', feeLimit: '300000' }] },
        });
    });

    it('prices the draft with the fee the backend estimates for it', async () => {
        const { normal } = await send.composeFeeLevels({ account, draft: draft(), context });

        expect(connect.solanaComposeTransaction).toHaveBeenCalledWith(
            expect.objectContaining({
                blockHash: 'known-hash',
                lastValidBlockHeight: 100,
                identity: 'wallet-identity',
                priorityFees: { computeUnitPrice: '1', computeUnitLimit: '200000' },
            }),
        );
        expect(normal).toMatchObject({
            type: 'final',
            fee: '7000',
            feePerByte: '10',
            feeLimit: '300000',
            totalSpent: '1000007000',
        });
    });

    it('refuses to leave less than the rent behind', async () => {
        const { normal } = await send.composeFeeLevels({
            account,
            draft: draft({ outputs: [{ ...draft().outputs[0]!, amount: '1.9995' }] }),
            context,
        });

        expect(normal).toMatchObject({
            type: 'error',
            error: 'REMAINING_BALANCE_LESS_THAN_RENT',
            errorMessage: { values: { rent: '0.00089088' } },
        });
    });

    it('keeps the network reserve out of the maximum when the user enabled it', async () => {
        const maxDraft = draft({
            setMaxOutputId: 0,
            outputs: [{ ...draft().outputs[0]!, amount: '' }],
        });

        const withReserve = await send.composeFeeLevels({
            account,
            draft: maxDraft,
            context: { ...context, isNetworkReserveEnabled: true },
        });

        expect(withReserve.normal).toMatchObject({ max: '1.996993' });
    });

    it('signs on a fresh blockhash with the priority fee the user approved', async () => {
        connect.blockchainGetInfo.mockResolvedValue({
            success: true,
            payload: { blockHash: 'fresh-hash', blockHeight: 200 },
        });
        connect.solanaComposeTransaction.mockResolvedValue({
            success: true,
            payload: { serializedTx: 'tx', additionalInfo: { tokenAccountInfo: { info: 1 } } },
        });
        connect.solanaSignTransaction.mockResolvedValue({
            success: true,
            payload: { serializedTx: 'signed' },
        });

        const signed = await send.sign({
            account,
            draft: draft(),
            precomposed: { feePerByte: '10', feeLimit: '300000' } as PrecomposedTransactionFinal,
            options: { device: { path: 'device' as DeviceUniquePath }, chunkify: false },
        });

        expect(signed).toEqual({ serializedTx: 'signed' });
        expect(connect.solanaComposeTransaction).toHaveBeenCalledWith(
            expect.objectContaining({
                blockHash: 'fresh-hash',
                lastValidBlockHeight: 200,
                priorityFees: { computeUnitPrice: '10', computeUnitLimit: '300000' },
            }),
        );
        expect(connect.solanaSignTransaction).toHaveBeenCalledWith(
            expect.objectContaining({
                serializedTx: 'tx',
                serialize: true,
                additionalInfo: { tokenAccountsInfos: [{ info: 1 }] },
                chunkify: false,
            }),
        );
    });

    it('cannot sign without the fee limit composing priced', async () => {
        await expect(
            send.sign({
                account,
                draft: draft(),
                precomposed: { feePerByte: '10' } as PrecomposedTransactionFinal,
                options: { device: {} },
            }),
        ).rejects.toMatchObject({ code: 'sign-failed', message: 'Fee limit missing.' });
    });
});
