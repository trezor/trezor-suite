import { configureMockStore } from '@suite-common/test-utils';
import { WalletAccountTransaction } from '@suite-common/wallet-types';
import TrezorConnect, { PrecomposeResultFinal } from '@trezor/connect';

import { chainedTxsFixture } from './chainedTransactions.fixture';
import {
    ComposeCancelTransactionThunkParams,
    composeCancelTransactionThunk,
} from '../../../src/send/composeCancelTransaction/composeCancelTransactionThunk';

const initStore = () => configureMockStore({});

const FIRST_ACCOUNT_CHANGE_ADDRESS = 'bcrt1qte33uyyfzrdrm9nqk0uwlq9dqr6ezu2gurhree';

const account: ComposeCancelTransactionThunkParams['account'] = {
    path: "m/84'/1'/0'",
    symbol: 'regtest',
    utxo: [],
    addresses: {
        change: [
            {
                address: FIRST_ACCOUNT_CHANGE_ADDRESS,
                path: "m/84'/1'/0'/1/0",
                transfers: 2,
                balance: '',
                sent: '',
                received: '',
            },
        ],
        used: [],
        unused: [
            {
                address: 'bcrt1qaqma3u205mykw7uhrav5tugn8ylu9f55uk8leg',
                path: "m/84'/1'/0'/0/1",
                transfers: 0,
                balance: '',
                sent: '',
                received: '',
            },
        ],
    },
};
const ORIGINAL_CHANGE_ADDRESS = 'bcrt1qte33uyyfzrdrm9nqk0uwlq9dqr6ezu2gurhree';

const transactionWithChange: Pick<WalletAccountTransaction, 'details' | 'vsize' | 'fee'> = {
    fee: '1410',
    vsize: 141,
    details: {
        vin: [
            {
                value: '10000000000',
                txid: 'c6a6069c1e19ebf6a0fc0db781208181d9352b10a1be8d5e3210670025551bfb',
                n: 0,
                addresses: ['bcrt1qreeergcmsw604zgd7hsreq6872swxnh3485fs5'],
                isAddress: true,
            },
        ],
        vout: [
            {
                value: '1000000000', // Spend 10BTC
                n: 0,
                addresses: ['bcrt1qjdkgvc67dnk3930gxj2valeadsg49datkyz7tu'],
                isAddress: true,
            },
            {
                value: '8999998590', // Change address
                n: 1,
                addresses: [ORIGINAL_CHANGE_ADDRESS],
                isAddress: true,
                isAccountOwned: true,
            },
        ],
        size: 222,
        totalInput: '10000000000',
        totalOutput: '9999998590',
    },
};

const transactionWithNoChange: Pick<WalletAccountTransaction, 'details' | 'vsize' | 'fee'> = {
    fee: '1100',
    vsize: 110,
    details: {
        vin: [
            {
                value: '8999998590',
                n: 0,
                addresses: ['bcrt1qte33uyyfzrdrm9nqk0uwlq9dqr6ezu2gurhree'],
                isAddress: true,
            },
        ],
        vout: [
            {
                value: '8999997490',
                n: 0,
                addresses: ['bcrt1qjdkgvc67dnk3930gxj2valeadsg49datkyz7tu'],
                isAddress: true,
            },
        ],
        size: 192,
        totalInput: '8999998590',
        totalOutput: '8999997490',
    },
};

const createComposeTsResult = (extra?: Partial<PrecomposeResultFinal>): PrecomposeResultFinal => ({
    bytes: 110,
    fee: '110',
    feePerByte: '1',
    inputs: [],
    outputs: [],
    outputsPermutation: [],
    totalSpent: '',
    type: 'final',
    ...extra,
});

const createComposeTransactionMock = () =>
    jest
        .spyOn(TrezorConnect, 'composeTransaction')

        // First `composeTransaction` call is just to get size of the transaction
        .mockImplementation(() =>
            Promise.resolve({ success: true, payload: [createComposeTsResult()] }),
        )

        // Second `composeTransaction` call calculates the fee
        .mockImplementation(() =>
            Promise.resolve({
                success: true,
                // 1520 + 1410 = 2930, responsibility of `composeTransaction` so not tested
                payload: [createComposeTsResult({ fee: '2930' })],
            }),
        );

describe(composeCancelTransactionThunk.name, () => {
    it('calculates correctly the cancel fee when there is a chain transaction and cancel transaction is less bytes then the original', async () => {
        const store = initStore();
        const composeTransactionMock = createComposeTransactionMock();

        await store
            .dispatch(
                composeCancelTransactionThunk({
                    tx: transactionWithChange,
                    account,
                    chainedTxs: chainedTxsFixture,
                }),
            )
            .unwrap();

        // First call
        const first = composeTransactionMock.mock.calls[0][0]; // First call, first argument
        expect(first.feeLevels[0].feePerUnit).toBe('1');
        expect(first.baseFee).toBe(undefined);

        // Second call
        const second = composeTransactionMock.mock.calls[1][0]; // Second call, first argument

        // This is the most important assertion. This is the fee, that satisfies the condition set by BIP-125
        // with the new size of the transaction of 110 bytes.
        expect(second.feeLevels[0].feePerUnit).toBe('13.81818181818181818182'); // = (1410 + 110 * 1) / 110
        expect(second.baseFee).toBe(1410); // This is the sum of fees for chained transactions
        expect(second.outputs).toStrictEqual([
            {
                address: ORIGINAL_CHANGE_ADDRESS,
                type: 'send-max',
            },
        ]);
    });

    it('uses first change address if tx has no change output (no chained transactions)', async () => {
        const store = initStore();

        const composeTransactionMock = createComposeTransactionMock();

        await store
            .dispatch(composeCancelTransactionThunk({ tx: transactionWithNoChange, account }))
            .unwrap();

        // Second call
        const second = composeTransactionMock.mock.calls[1][0]; // Second call, first argument

        expect(second.outputs).toStrictEqual([
            {
                address: FIRST_ACCOUNT_CHANGE_ADDRESS,
                type: 'send-max',
            },
        ]);
    });
});
