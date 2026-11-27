import { sendFormActions } from '@suite-common/wallet-core';
import { type PrecomposedTransactionFinal } from '@suite-common/wallet-types';
import TrezorConnect, { type PROTO } from '@trezor/connect';

import { type PopupFlowPayload } from './CommonPopupFlow';
import { SignTransaction } from './signTransaction';

jest.mock('@trezor/connect', () => ({
    ...jest.requireActual('@trezor/connect'),
    __esModule: true,
    default: { precomposeSignTransaction: jest.fn() },
}));

jest.mock('@suite-common/wallet-core', () => ({
    ...jest.requireActual('@suite-common/wallet-core'),
    selectAccountForNetworkSymbolAndPath: () => ({ key: 'account-key' }),
}));

const mockedPrecompose = TrezorConnect.precomposeSignTransaction as jest.Mock;

const input: PROTO.TxInputType = {
    address_n: [2147483732, 2147483648, 2147483648, 0, 0],
    prev_hash: 'e294c4c172c3d87991b0369e45d6af8584be92914d01e3060fad1ed31d12ff00',
    prev_index: 0,
    amount: '10000',
    script_type: 'SPENDWITNESS',
};

const output: PROTO.TxOutputType = {
    address: 'bc1qtest',
    amount: '9000',
    script_type: 'PAYTOADDRESS',
};

const payload: PopupFlowPayload<'signTransaction'> = {
    coin: 'btc',
    inputs: [input],
    outputs: [output],
};

const precomposedTx = (totalSpent: string): PrecomposedTransactionFinal => ({
    type: 'final',
    inputs: [input],
    outputsPermutation: [0],
    outputs: [output],
    totalSpent,
    fee: '1000',
    feePerByte: '9',
    bytes: 110,
    max: undefined,
});

const prepareSigning = async (composedTx?: PrecomposedTransactionFinal) => {
    const dispatch = jest.fn(action => action);
    const flow = new SignTransaction(
        {
            method: 'signTransaction',
            payload,
            source: {
                type: 'walletconnect',
                origin: 'https://dapp.example',
                manifest: { appName: 'dapp' },
            },
        },
        { dispatch, getState: () => ({}), signal: new AbortController().signal },
    );

    await flow['prepareSigning'](composedTx);

    return dispatch.mock.calls
        .map(([action]) => action)
        .find(sendFormActions.storePrecomposedTransaction.match)?.payload.precomposedTransaction;
};

describe('SignTransaction.prepareSigning', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('reviews a transaction composed by sendTransaction as it was composed', async () => {
        const composedTx = precomposedTx('9000');

        await expect(prepareSigning(composedTx)).resolves.toBe(composedTx);
        expect(mockedPrecompose).not.toHaveBeenCalled();
    });

    it('reviews the transaction of a host as Connect precomposes it', async () => {
        const hostTx = precomposedTx('10000');
        mockedPrecompose.mockResolvedValueOnce({ success: true, payload: hostTx });

        await expect(prepareSigning()).resolves.toBe(hostTx);
        expect(mockedPrecompose).toHaveBeenCalledWith(payload);
    });

    it('skips the review when Connect cannot precompose the transaction', async () => {
        mockedPrecompose.mockResolvedValueOnce({ success: false, payload: { error: 'failed' } });

        await expect(prepareSigning()).resolves.toBeUndefined();
    });
});
