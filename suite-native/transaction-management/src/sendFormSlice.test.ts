import { configureStore } from '@reduxjs/toolkit';

import { mockActionType, mockReducer } from '@suite-common/redux-utils/mocks';
import { toTokenAddress } from '@suite-common/wallet-types';
import { mockAccountKey } from '@suite-common/wallet-types/mocks';

import { createFeeLevels, createFeeLevelsMaxAmount } from './__fixtures__/feeLevels';
import { prepareSendFormReducer, transactionManagementActions } from './sendFormSlice';

describe('sendFormSlice', () => {
    // Create a test store with the prepared reducer
    const createTestStore = () => {
        const reducer = prepareSendFormReducer({
            actionTypes: { storageLoad: mockActionType('storageLoad') },
            reducers: { storageLoadFormDrafts: mockReducer() },
        });

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
            const feeLevels = createFeeLevels({
                normal: { fee: '433210428000', feePerByte: '1' },
                high: { fee: '733210428000', feePerByte: '4', feeLimit: '21000' },
            });

            store.dispatch(transactionManagementActions.storeFeeLevels({ feeLevels }));

            expect(store.getState().send.feeLevels).toEqual(feeLevels);
        });

        it('should replace existing fee levels', () => {
            const store = createTestStore();
            const initialFeeLevels = createFeeLevels({
                normal: { fee: '433210428000', feePerByte: '1' },
            });

            store.dispatch(
                transactionManagementActions.storeFeeLevels({ feeLevels: initialFeeLevels }),
            );

            const newFeeLevels = createFeeLevels({
                custom: {
                    totalSpent: '1000426691398000',
                    fee: '426691398000',
                    feePerByte: '2',
                    feeLimit: '31000',
                    estimatedFeeLimit: '31000',
                },
            });

            store.dispatch(
                transactionManagementActions.storeFeeLevels({ feeLevels: newFeeLevels }),
            );

            expect(store.getState().send.feeLevels).toEqual(newFeeLevels);
            expect(store.getState().send.feeLevels).not.toEqual(initialFeeLevels);
        });

        it('should store empty fee levels', () => {
            const store = createTestStore();
            const emptyFeeLevels = createFeeLevels({});

            store.dispatch(
                transactionManagementActions.storeFeeLevels({ feeLevels: emptyFeeLevels }),
            );

            expect(store.getState().send.feeLevels).toEqual(emptyFeeLevels);
        });
    });

    describe('clearFeeLevels', () => {
        it('should clear fee levels when they exist', () => {
            const store = createTestStore();
            const feeLevels = createFeeLevels({
                normal: { fee: '433210428000', feePerByte: '1' },
                high: { fee: '733210428000', feePerByte: '4', feeLimit: '21000' },
            });

            store.dispatch(transactionManagementActions.storeFeeLevels({ feeLevels }));
            expect(store.getState().send.feeLevels).toEqual(feeLevels);

            store.dispatch(transactionManagementActions.clearFeeLevels());
            expect(store.getState().send.feeLevels).toEqual({});
        });

        it('should clear fee levels when they are already empty', () => {
            const store = createTestStore();

            // Verify initial state is empty
            expect(store.getState().send.feeLevels).toEqual({});

            // Clear fee levels (should remain empty)
            store.dispatch(transactionManagementActions.clearFeeLevels());
            expect(store.getState().send.feeLevels).toEqual({});
        });
    });

    describe('storeFeeLevelsMaxAmount', () => {
        it('should store maximum amounts by send form', () => {
            const store = createTestStore();
            const accountKey = mockAccountKey();
            const feeLevelsMaxAmount = createFeeLevelsMaxAmount({
                economy: '100',
                normal: '90',
                high: '80',
            });

            store.dispatch(
                transactionManagementActions.storeFeeLevelsMaxAmount({
                    accountKey,
                    feeLevelsMaxAmount,
                }),
            );

            expect(store.getState().send.feeLevelsMaxAmount).toEqual({
                [accountKey]: feeLevelsMaxAmount,
            });
        });

        it('should keep maximum amounts for other send forms', () => {
            const store = createTestStore();
            const accountKey = mockAccountKey();
            const tokenContract = toTokenAddress('token');

            store.dispatch(
                transactionManagementActions.storeFeeLevelsMaxAmount({
                    accountKey,
                    feeLevelsMaxAmount: createFeeLevelsMaxAmount({ normal: '90' }),
                }),
            );
            store.dispatch(
                transactionManagementActions.storeFeeLevelsMaxAmount({
                    accountKey,
                    tokenContract,
                    feeLevelsMaxAmount: createFeeLevelsMaxAmount({ normal: '190' }),
                }),
            );

            expect(store.getState().send.feeLevelsMaxAmount).toEqual({
                [accountKey]: createFeeLevelsMaxAmount({ normal: '90' }),
                [`${accountKey}-${tokenContract}`]: createFeeLevelsMaxAmount({ normal: '190' }),
            });
        });
    });

    describe('clearFeeLevelsMaxAmount', () => {
        it('should clear only the requested send form maximum amounts', () => {
            const store = createTestStore();
            const firstAccountKey = mockAccountKey({ descriptor: 'first' });
            const secondAccountKey = mockAccountKey({ descriptor: 'second' });
            const secondFeeLevelsMaxAmount = createFeeLevelsMaxAmount({ normal: '190' });

            store.dispatch(
                transactionManagementActions.storeFeeLevelsMaxAmount({
                    accountKey: firstAccountKey,
                    feeLevelsMaxAmount: createFeeLevelsMaxAmount({ normal: '90' }),
                }),
            );
            store.dispatch(
                transactionManagementActions.storeFeeLevelsMaxAmount({
                    accountKey: secondAccountKey,
                    feeLevelsMaxAmount: secondFeeLevelsMaxAmount,
                }),
            );

            store.dispatch(
                transactionManagementActions.clearFeeLevelsMaxAmount({
                    accountKey: firstAccountKey,
                }),
            );

            expect(store.getState().send.feeLevelsMaxAmount).toEqual({
                [secondAccountKey]: secondFeeLevelsMaxAmount,
            });
        });
    });
});
