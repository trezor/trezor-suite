import { createTestStore } from '@suite-common/test-utils';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import type { WalletAccountTransaction } from '@suite-common/wallet-types';
import TrezorConnect, { type PrecomposeResultFinal } from '@trezor/connect';

import { chainedTxsFixture } from './__fixtures__/chainedTransactions.fixture';
import {
    type ComposeCancelTransactionThunkParams,
    composeCancelTransactionThunk,
} from './composeCancelTransactionThunk';

const initStore = () => createTestStore({ extra: undefined });

const UNUSED_CHANGE_ADDRESS = 'bcrt1qte33uyyfzrdrm9nqk0uwlq9dqr6ezu2gurhree';

const account: ComposeCancelTransactionThunkParams['account'] = {
    path: "m/84'/1'/0'",
    symbol: asNetworkSymbol('regtest'),
    addresses: {
        change: [
            {
                address: UNUSED_CHANGE_ADDRESS,
                path: "m/84'/1'/0'/1/0",
                transfers: 0,
                balance: '',
                sent: '',
                received: '',
            },
        ],
        used: [],
        unused: [],
    },
};

const ORIGINAL_CHANGE_ADDRESS = 'bcrt1qejqxwzfld7zr6mf7ygqy5s5se5xq7vmt8ntmj0';

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
                addresses: ['bcrt1qreeergcmsw604zgd7hsreq6872swxnh3485fs5'],
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
        .mockClear()
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

        const [call] = composeTransactionMock.mock.calls[0] ?? [];
        expect(call?.feeLevels).toStrictEqual([{ feePerUnit: '0.2' }]); // new relay fee
        expect(call?.baseFee).toBe(1410 + 1410); // sum of fees for original tx and chained txs
        expect(call?.outputs).toStrictEqual([
            { address: ORIGINAL_CHANGE_ADDRESS, type: 'send-max' },
        ]);
    });

    it('uses first unused change address if tx has no change output (no chained transactions)', async () => {
        const store = initStore();

        const composeTransactionMock = createComposeTransactionMock();

        await store
            .dispatch(composeCancelTransactionThunk({ tx: transactionWithNoChange, account }))
            .unwrap();

        const [call] = composeTransactionMock.mock.calls[0] ?? [];

        expect(call?.outputs).toStrictEqual([{ address: UNUSED_CHANGE_ADDRESS, type: 'send-max' }]);
    });
});
