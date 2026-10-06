import { combineReducers, configureStore } from '@reduxjs/toolkit';

import { type DeviceReducerState, deviceInitialState } from '@suite-common/device';
import { mockActionType } from '@suite-common/redux-utils/mocks';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { asNetworkSymbol } from '@suite-common/wallet-config';
import {
    type SendFormReducerDeps,
    prepareSendFormReducer,
    sendFormActions,
} from '@suite-common/wallet-core';
import { type Account, type PrecomposedTransactionFinal } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';

import { solanaSignTransaction } from './solanaSignTransaction';
import { CALL_SOURCE_WEB } from '../connectPopupTypes';

const PATH = "m/44'/501'/0'/0'";
const STATIC_SESSION_ID = '1stTestnetAddress@device_id:0';

const account = mockWalletAccount({
    symbol: asNetworkSymbol('sol'),
    path: PATH,
    deviceState: STATIC_SESSION_ID,
});
const deviceState: DeviceReducerState = {
    ...deviceInitialState,
    selectedDevice: mockSuiteDevice({
        connected: true,
        state: { staticSessionId: STATIC_SESSION_ID },
    }),
};
const sendFormReducerDeps: SendFormReducerDeps = {
    actionTypes: { storageLoad: mockActionType('storageLoad') },
    reducers: { storageLoadFormDrafts: () => {} },
};

const createStore = () =>
    configureStore({
        reducer: combineReducers({
            wallet: combineReducers({
                accounts: (state: Account[] = [account]) => state,
                send: prepareSendFormReducer(sendFormReducerDeps),
            }),
            device: (state: DeviceReducerState = deviceState) => state,
        }),
    });

const precomposedTransfer = (address: string): PrecomposedTransactionFinal => ({
    type: 'final',
    inputs: [],
    outputs: [{ address, amount: '1000000', script_type: 'PAYTOADDRESS' }],
    outputsPermutation: [0],
    totalSpent: '1005000',
    fee: '5000',
    feePerByte: '0',
    bytes: 0,
});

const runPreCallHook = (
    store: ReturnType<typeof createStore>,
    txSigningPrecomposed: PrecomposedTransactionFinal | undefined,
) =>
    solanaSignTransaction.preCallHook({
        method: 'solanaSignTransaction',
        payload: { path: PATH, serializedTx: '00' },
        dispatch: store.dispatch,
        getState: store.getState,
        txSigningPrecomposed,
        source: {
            type: CALL_SOURCE_WEB,
            origin: 'https://example.com',
            manifest: { appName: 'Test app' },
        },
    });

describe('solanaSignTransaction preCallHook', () => {
    const storeEarlierCallReview = (store: ReturnType<typeof createStore>) =>
        store.dispatch(
            sendFormActions.storePrecomposedTransaction({
                formState: {
                    outputs: [],
                    feeLimit: '',
                    feePerUnit: '',
                    selectedUtxos: [],
                    isCoinControlEnabled: false,
                    hasCoinControlBeenOpened: false,
                    options: [],
                    selectedFee: 'custom',
                },
                precomposedTransaction: precomposedTransfer('earlier-call-recipient'),
            }),
        );

    it('stores the review of this call', async () => {
        const store = createStore();
        storeEarlierCallReview(store);

        await runPreCallHook(store, precomposedTransfer('this-call-recipient'));

        expect(store.getState().wallet.send.precomposedTx?.outputs).toEqual([
            { address: 'this-call-recipient', amount: '1000000', script_type: 'PAYTOADDRESS' },
        ]);
    });

    it('leaves no review of an earlier call when this call has none', async () => {
        const store = createStore();
        storeEarlierCallReview(store);

        await runPreCallHook(store, undefined);

        expect(store.getState().wallet.send.precomposedTx).toBeUndefined();
    });
});
