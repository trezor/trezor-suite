import { combineReducers } from '@reduxjs/toolkit';

import type { FeeInfo, FormState } from '@suite-common/wallet-types';
import { createLightStore, createStaticReducer } from '@suite-native/test-utils-store';
import type { ReduxStoreWithThunk } from '@trezor/redux-utils';
import { mockActionType, mockReducer } from '@trezor/redux-utils/mocks';

import { createFeeLevel } from './__fixtures__/feeLevels';
import { BTC_ACCOUNT_KEY, getBtcAccount } from './__fixtures__/walletState';
import { type NativeSendRootState, prepareSendFormReducer } from './sendFormSlice';
import {
    type CalculateFeeLevelsMaxAmountThunkState,
    calculateCustomFeeLevelThunk,
    calculateFeeLevelsMaxAmountThunk,
} from './thunks';

const mockComposeSendFormTransactionFeeLevelsThunk = jest.fn();

jest.mock('@suite-common/wallet-core', () => ({
    ...jest.requireActual('@suite-common/wallet-core'),
    composeSendFormTransactionFeeLevelsThunk: Object.assign(
        (params: unknown) => () => {
            mockComposeSendFormTransactionFeeLevelsThunk(params);

            return Promise.resolve({
                type: 'composeSendFormTransactionFeeLevelsThunk/fulfilled',
                payload: {
                    normal: { type: 'final', max: '0.009' },
                    economy: { type: 'final', max: '0.008' },
                    custom: createFeeLevel({ fee: '200' }),
                },
                meta: { requestId: 'test-request-id', requestStatus: 'fulfilled' },
            });
        },
        jest.requireActual('@suite-common/wallet-core').composeSendFormTransactionFeeLevelsThunk,
    ),
}));

describe('calculateFeeLevelsMaxAmountThunk', () => {
    const feeInfo: FeeInfo = {
        blockHeight: 0,
        blockTime: 10,
        minFee: 1,
        maxFee: 100,
        minPriorityFee: 0,
        dustLimit: 546,
        levels: [{ label: 'normal', feePerUnit: '2', blocks: 1 }],
    };

    const formState = {
        outputs: [],
        selectedFee: 'normal',
        feePerUnit: '',
        feeLimit: '',
        options: [],
    } as unknown as FormState;

    const createStore = () =>
        createLightStore({
            reducer: {
                wallet: combineReducers({
                    accounts: createStaticReducer([getBtcAccount()]),
                    fees: createStaticReducer({ btc: { status: 'loaded', data: feeInfo } }),
                    send: prepareSendFormReducer({
                        actionTypes: { storageLoad: mockActionType('storageLoad') },
                        reducers: { storageLoadFormDrafts: mockReducer() },
                    }),
                }),
            },
        }) as unknown as ReduxStoreWithThunk<
            CalculateFeeLevelsMaxAmountThunkState & NativeSendRootState,
            Record<never, never>
        >;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('returns custom preview levels without replacing the confirmed fee store', async () => {
        const store = createStore();
        const levelsBefore = store.getState().wallet.send.feeLevels;
        const response = await store.dispatch(
            calculateCustomFeeLevelThunk({
                accountKey: BTC_ACCOUNT_KEY,
                formState,
                selectedFeeLevel: 'custom',
                customFeePerUnit: '15',
                customFeeLimit: '30000',
                customMaxFeePerGas: '30',
                customMaxPriorityFeePerGas: '3',
            }),
        );
        expect(response.meta.requestStatus).toBe('fulfilled');
        expect(store.getState().wallet.send.feeLevels).toEqual(levelsBefore);
        expect(mockComposeSendFormTransactionFeeLevelsThunk).toHaveBeenLastCalledWith(
            expect.objectContaining({
                formState: expect.objectContaining({
                    selectedFee: 'custom',
                    feePerUnit: '15',
                    feeLimit: '30000',
                    maxFeePerGas: '30',
                    maxPriorityFeePerGas: '3',
                }),
            }),
        );
    });

    it.each([true, false, undefined])(
        'should pass assumeNewAccount=%s to compose context and return max amounts',
        async assumeNewAccount => {
            const store = createStore();

            const result = await store.dispatch(
                calculateFeeLevelsMaxAmountThunk({
                    formState,
                    accountKey: BTC_ACCOUNT_KEY,
                    assumeNewAccount,
                }),
            );

            expect(mockComposeSendFormTransactionFeeLevelsThunk).toHaveBeenCalledWith({
                formState: { ...formState, setMaxOutputId: 0 },
                composeContext: expect.objectContaining({
                    account: expect.objectContaining({ key: BTC_ACCOUNT_KEY }),
                    assumeNewAccount,
                }),
            });
            expect(result.payload).toEqual({ normal: '0.009', economy: '0.008' });
        },
    );
});
