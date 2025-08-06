import { configureStore } from '@reduxjs/toolkit';

import { extraDependenciesMock } from '@suite-common/test-utils';
import { GeneralPrecomposedLevels } from '@suite-common/wallet-types';

import { initialState, sendFormSlice, storeFeeLevels } from '../sendFormSlice';

describe('sendFormSlice', () => {
    // Create a test store with the prepared reducer
    const createTestStore = () => {
        const reducer = sendFormSlice.prepareReducer(extraDependenciesMock);

        return configureStore({
            reducer: { send: reducer },
            middleware: getDefaultMiddleware =>
                getDefaultMiddleware({
                    serializableCheck: false,
                    immutableCheck: false,
                }),
        });
    };

    describe('storeFeeLevels', () => {
        it('should store fee levels', () => {
            const store = createTestStore();
            const feeLevels: GeneralPrecomposedLevels = {
                normal: {
                    type: 'final',
                    totalSpent: '1000433210428000',
                    fee: '433210428000',
                    feePerByte: '1',
                    feeLimit: '11000',
                    bytes: 250,
                    inputs: [],
                    estimatedFeeLimit: '11000',
                } as any,
                high: {
                    type: 'final',
                    totalSpent: '1000433210428000',
                    fee: '733210428000',
                    feePerByte: '4',
                    feeLimit: '21000',
                    bytes: 250,
                    inputs: [],
                    estimatedFeeLimit: '21000',
                } as any,
            };

            store.dispatch(storeFeeLevels({ feeLevels }));

            expect(store.getState().send.feeLevels).toEqual(feeLevels);
        });

        it('should replace existing fee levels', () => {
            const store = createTestStore();
            const initialFeeLevels: GeneralPrecomposedLevels = {
                normal: {
                    type: 'final',
                    totalSpent: '1000433210428000',
                    fee: '433210428000',
                    feePerByte: '1',
                    feeLimit: '11000',
                    bytes: 250,
                    inputs: [],
                    estimatedFeeLimit: '11000',
                } as any,
            };

            // Set initial fee levels
            store.dispatch(storeFeeLevels({ feeLevels: initialFeeLevels }));

            const newFeeLevels: GeneralPrecomposedLevels = {
                custom: {
                    type: 'final',
                    totalSpent: '1000426691398000',
                    fee: '426691398000',
                    feePerByte: '2',
                    feeLimit: '31000',
                    bytes: 250,
                    inputs: [],
                    estimatedFeeLimit: '31000',
                } as any,
            };

            store.dispatch(storeFeeLevels({ feeLevels: newFeeLevels }));

            expect(store.getState().send.feeLevels).toEqual(newFeeLevels);
            expect(store.getState().send.feeLevels).not.toEqual(initialFeeLevels);
        });

        it('should store empty fee levels', () => {
            const store = createTestStore();
            const emptyFeeLevels: GeneralPrecomposedLevels = {};

            store.dispatch(storeFeeLevels({ feeLevels: emptyFeeLevels }));

            expect(store.getState().send.feeLevels).toEqual(emptyFeeLevels);
        });
    });

    it('should return initial state when store is created', () => {
        const store = createTestStore();
        const state = store.getState().send;

        expect(state).toEqual(initialState);
    });

    describe('action creators', () => {
        it('should create storeFeeLevels action with correct payload', () => {
            const feeLevels: GeneralPrecomposedLevels = {
                normal: {
                    type: 'final',
                    totalSpent: '1000433210428000',
                    fee: '433210428000',
                    feePerByte: '1',
                    feeLimit: '11000',
                    bytes: 250,
                    inputs: [],
                    estimatedFeeLimit: '11000',
                } as any,
            };

            const action = storeFeeLevels({ feeLevels });

            expect(action.type).toBe('send/storeFeeLevels');
            expect(action.payload).toEqual({ feeLevels });
        });
    });

    describe('state immutability', () => {
        it('should not mutate the original state', () => {
            const store = createTestStore();
            const originalState = store.getState().send;
            const feeLevels: GeneralPrecomposedLevels = {
                normal: {
                    type: 'final',
                    totalSpent: '1000433210428000',
                    fee: '433210428000',
                    feePerByte: '1',
                    feeLimit: '11000',
                    bytes: 250,
                    inputs: [],
                    estimatedFeeLimit: '11000',
                } as any,
            };

            store.dispatch(storeFeeLevels({ feeLevels }));

            // The original state object should not be mutated
            expect(originalState).not.toBe(store.getState().send);
        });
    });
});
