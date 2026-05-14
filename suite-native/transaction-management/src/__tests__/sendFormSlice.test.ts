import { configureStore } from '@reduxjs/toolkit';

import { extraDependenciesCommonMock } from '@suite-common/test-utils';

import { createFeeLevels } from '../__fixtures__/feeLevels';
import { sendFormSlice, transactionManagementActions } from '../sendFormSlice';

describe('sendFormSlice', () => {
    // Create a test store with the prepared reducer
    const createTestStore = () => {
        const reducer = sendFormSlice.prepareReducer(extraDependenciesCommonMock);

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
});
