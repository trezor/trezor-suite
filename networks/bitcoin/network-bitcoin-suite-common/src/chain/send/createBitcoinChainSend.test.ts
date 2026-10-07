import type { AccountUtxo, DeviceUniquePath } from '@trezor/connect-common';
import type {
    ChainComposeContext,
    ChainSendAccount,
    ChainSendDraft,
    PrecomposedTransactionFinal,
} from '@trezor/network-module-suite-common-types';
import { asNetworkSymbol } from '@trezor/network-module-types';

import { getUtxoOutpoint } from './bitcoinSendHelpers';
import { createBitcoinChainSend } from './createBitcoinChainSend';

const connect = {
    composeTransaction: jest.fn(),
    composePsbt: jest.fn(),
    signTransaction: jest.fn(),
    pushTransaction: jest.fn(),
};

const send = createBitcoinChainSend({
    getTrezorConnect: () => connect,
    datetimeToLocktime: () => undefined,
})(asNetworkSymbol('btc'));

const utxo = (txid: string, vout: number) =>
    ({ txid: txid.repeat(64), vout, amount: '1000', blockHeight: 1 }) as AccountUtxo;

const spendable = utxo('a', 0);
const excluded = utxo('b', 1);

const account: ChainSendAccount = {
    symbol: asNetworkSymbol('btc'),
    descriptor: 'zpub',
    index: 0,
    path: "m/84'/0'/0'",
    accountType: 'normal',
    deviceState: 'wallet-identity',
    balance: '2000',
    availableBalance: '2000',
    formattedBalance: '0.00002',
    utxo: [spendable, excluded],
    addresses: { change: [], used: [], unused: [] },
};

const draft = (overrides: Partial<ChainSendDraft> = {}): ChainSendDraft => ({
    outputs: [
        {
            type: 'payment',
            address: 'bc1recipient',
            amount: '0.00001',
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
        blockTime: 10,
        minFee: 1,
        maxFee: 100,
        minPriorityFee: 0,
        levels: [{ label: 'normal', feePerUnit: '3', blocks: 2 }],
    },
    excludedUtxos: { [getUtxoOutpoint(excluded)]: 'dust' },
};

// Composing formats Connect's results in place, so every call gets fresh ones.
const final = () => ({
    type: 'final',
    fee: '200',
    feePerByte: '3.333',
    totalSpent: '1200',
    max: '1800',
});

describe('createBitcoinChainSend', () => {
    beforeEach(() => {
        jest.resetAllMocks();
    });

    it('selects from spendable UTXOs, signals RBF and rounds the fee rate', async () => {
        connect.composeTransaction.mockResolvedValue({ success: true, payload: [final()] });

        const { normal } = await send.composeFeeLevels({ account, draft: draft(), context });

        expect(connect.composeTransaction).toHaveBeenCalledWith(
            expect.objectContaining({
                account: expect.objectContaining({ utxo: [spendable] }),
                outputs: [{ type: 'payment', address: 'bc1recipient', amount: '1000' }],
                sequence: 0xffffffff - 2,
                sortingStrategy: 'random',
                coin: 'btc',
            }),
        );
        expect(normal).toMatchObject({ feePerByte: '3.33', max: '0.000018' });
    });

    it('takes amounts in satoshis when the user enters them so', async () => {
        connect.composeTransaction.mockResolvedValue({ success: true, payload: [final()] });

        const { normal } = await send.composeFeeLevels({
            account,
            draft: draft({ outputs: [{ ...draft().outputs[0]!, amount: '1000' }] }),
            context: { ...context, isSmallestUnitEnabled: true },
        });

        expect(connect.composeTransaction).toHaveBeenCalledWith(
            expect.objectContaining({
                outputs: [{ type: 'payment', address: 'bc1recipient', amount: '1000' }],
            }),
        );
        expect(normal).toMatchObject({ max: '1800' });
    });

    it('finds the cheapest affordable fee when no level is', async () => {
        connect.composeTransaction
            .mockResolvedValueOnce({
                success: true,
                payload: [{ type: 'error', error: 'NOT-ENOUGH-FUNDS' }],
            })
            .mockResolvedValueOnce({
                success: true,
                payload: [{ type: 'error', error: 'NOT-ENOUGH-FUNDS' }, final()],
            });

        const levels = await send.composeFeeLevels({ account, draft: draft(), context });

        expect(connect.composeTransaction).toHaveBeenLastCalledWith(
            expect.objectContaining({
                feeLevels: [
                    { feePerUnit: '2', label: 'custom', blocks: -1 },
                    { feePerUnit: '1', label: 'custom', blocks: -1 },
                ],
            }),
        );
        expect(levels.normal).toMatchObject({ errorMessage: { id: 'AMOUNT_IS_NOT_ENOUGH' } });
        expect(levels.custom).toMatchObject({ type: 'final' });
    });

    it('keeps the original inputs and output order of a replacement, from local history on coinjoin', async () => {
        connect.signTransaction.mockResolvedValue({
            success: true,
            payload: { serializedTx: 'signed', signedTransaction: { txid: 'new' } },
        });
        const replaced = { txid: 'orig' };

        const signed = await send.sign({
            account: { ...account, accountType: 'coinjoin' },
            draft: draft({
                rbfParams: {
                    type: 'bitcoin',
                    txid: 'orig',
                    utxo: [spendable],
                    outputs: [
                        { type: 'change', address: 'bc1change', amount: '1', formattedAmount: '' },
                        {
                            type: 'payment',
                            address: 'bc1recipient',
                            amount: '1',
                            formattedAmount: '',
                        },
                    ],
                    feeRate: '1',
                    baseFee: 100,
                },
            }),
            precomposed: {
                type: 'final',
                rbfType: 'bump-fee',
                useNativeRbf: true,
                prevTxid: 'orig',
                feeDifference: '100',
                inputs: [{ prev_hash: 'a' }, { prev_hash: 'b' }],
                outputs: [
                    { address: 'bc1recipient', amount: '1', script_type: 'PAYTOADDRESS' },
                    { address_n: [1], amount: '1', script_type: 'PAYTOWITNESS' },
                ],
            } as unknown as PrecomposedTransactionFinal,
            options: {
                device: { path: 'device' as DeviceUniquePath },
                replacedTransactions: [replaced, { txid: 'other' }] as never,
            },
        });

        expect(signed).toEqual({ serializedTx: 'signed', signedTransaction: { txid: 'new' } });
        const payload = connect.signTransaction.mock.calls[0][0];
        expect(payload.inputs).toEqual([
            { prev_hash: 'a', orig_index: 0, orig_hash: 'orig' },
            { prev_hash: 'b' },
        ]);
        expect(payload.outputs.map((o: { orig_index?: number }) => o.orig_index)).toEqual([0, 1]);
        expect(payload.account.transactions).toEqual([replaced]);
        expect(payload.version).toBe(2);
    });

    it('shows the signed transaction as the history will list it', () => {
        const transaction = send.createPendingTransaction!({
            account: {
                ...account,
                addresses: {
                    change: [],
                    used: [
                        {
                            address: 'bc1own',
                            path: "m/84'/0'/0'/0/0",
                            transfers: 1,
                            balance: '0',
                            sent: '1200',
                            received: '1200',
                        },
                    ],
                    unused: [],
                },
            },
            precomposed: final() as unknown as PrecomposedTransactionFinal,
            signed: {
                serializedTx: 'signed',
                signedTransaction: {
                    txid: 'new',
                    hex: 'signed',
                    blockHeight: 0,
                    confirmations: 0,
                    blockTime: 1,
                    value: '1000',
                    valueIn: '1200',
                    fees: '200',
                    vin: [{ n: 0, addresses: ['bc1own'], isAddress: true, value: '1200' }],
                    vout: [{ n: 0, addresses: ['bc1recipient'], isAddress: true, value: '1000' }],
                },
            },
            txid: 'new',
        });

        expect(transaction).toMatchObject({
            type: 'sent',
            txid: 'new',
            amount: '1000',
            fee: '200',
            targets: [{ addresses: ['bc1recipient'], amount: '1000' }],
        });
    });

    it('falls back to the composed transaction without a signed one', () => {
        const transaction = send.createPendingTransaction!({
            account,
            precomposed: {
                ...final(),
                outputs: [{ address: 'bc1recipient', amount: '1000' }],
            } as unknown as PrecomposedTransactionFinal,
            signed: { serializedTx: 'signed' },
            txid: 'new',
        });

        expect(transaction).toMatchObject({
            type: 'sent',
            txid: 'new',
            amount: '1000',
            fee: '200',
        });
    });
});
