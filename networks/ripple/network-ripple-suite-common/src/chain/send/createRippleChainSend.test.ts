import type { DeviceUniquePath } from '@trezor/connect-common';
import type {
    ChainComposeContext,
    ChainSendAccount,
    ChainSendDraft,
    PrecomposedTransactionFinal,
} from '@trezor/network-module-suite-common-types';
import { asNetworkSymbol } from '@trezor/network-module-types';

import { createRippleChainSend } from './createRippleChainSend';

const RECIPIENT = 'rPEPPER7kfTD9w2To4CQk6UCfuHM9c6GDY';

const connect = {
    getAccountInfo: jest.fn(),
    rippleSignTransaction: jest.fn(),
    pushTransaction: jest.fn(),
};

const send = createRippleChainSend({ getTrezorConnect: () => connect })(asNetworkSymbol('xrp'));

const account: ChainSendAccount = {
    symbol: asNetworkSymbol('xrp'),
    descriptor: 'rSender',
    index: 0,
    path: "m/44'/144'/0'/0/0",
    accountType: 'normal',
    deviceState: 'wallet-identity',
    balance: '30000000',
    availableBalance: '20000000',
    formattedBalance: '30',
    misc: { sequence: 7, reserve: '10000000' },
};

const draft = (overrides: Partial<ChainSendDraft> = {}): ChainSendDraft => ({
    outputs: [
        {
            type: 'payment',
            address: RECIPIENT,
            amount: '5',
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
        blockTime: 3,
        minFee: 10,
        maxFee: 1000,
        minPriorityFee: 0,
        levels: [{ label: 'normal', feePerUnit: '12', blocks: -1 }],
    },
};

describe('createRippleChainSend', () => {
    beforeEach(() => {
        jest.resetAllMocks();
        connect.getAccountInfo.mockResolvedValue({ success: true, payload: { empty: false } });
    });

    it('pays the amount and the fee from the available balance', async () => {
        const { normal } = await send.composeFeeLevels({ account, draft: draft(), context });

        expect(normal).toMatchObject({
            type: 'final',
            fee: '12',
            totalSpent: '5000012',
            outputs: [{ address: RECIPIENT, amount: '5000000' }],
        });
    });

    it('asks for at least the reserve of a recipient that does not exist yet', async () => {
        connect.getAccountInfo.mockResolvedValue({
            success: true,
            payload: { empty: true, misc: { reserve: '10000000' } },
        });

        const { normal } = await send.composeFeeLevels({ account, draft: draft(), context });

        expect(normal).toMatchObject({
            type: 'error',
            error: 'AMOUNT_IS_LESS_THAN_RESERVE',
            errorMessage: { values: { reserve: '10', displaySymbol: 'XRP' } },
        });
    });

    it('lowers the fee towards the minimum when no level can pay it', async () => {
        const { normal, custom } = await send.composeFeeLevels({
            account: { ...account, availableBalance: '5000011' },
            draft: draft(),
            context,
        });

        expect(normal).toMatchObject({ type: 'error', error: 'AMOUNT_IS_NOT_ENOUGH' });
        expect(custom).toMatchObject({ type: 'final', fee: '11' });
    });

    it('signs a payment at the account sequence with the destination tag', async () => {
        connect.rippleSignTransaction.mockResolvedValue({
            success: true,
            payload: { serializedTx: 'signed' },
        });

        const signed = await send.sign({
            account,
            draft: draft({ destinationTag: '123' }),
            precomposed: { feePerByte: '12' } as PrecomposedTransactionFinal,
            options: { device: { path: 'device' as DeviceUniquePath }, chunkify: true },
        });

        expect(signed).toEqual({ serializedTx: 'signed' });
        expect(connect.rippleSignTransaction).toHaveBeenCalledWith({
            device: { path: 'device' },
            path: account.path,
            transaction: {
                fee: '12',
                flags: 0x80000000,
                sequence: 7,
                payment: { destination: RECIPIENT, amount: '5000000', destinationTag: 123 },
            },
            payment_req: undefined,
            chunkify: true,
        });
    });
});
