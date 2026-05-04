import { configureStore } from '@reduxjs/toolkit';

import { createNotificationsReducer } from '@suite-common/toast-notifications';
import { asWalletDescriptor } from '@suite-common/wallet-types';

import { createHandleSparkWalletIncomingTransaction } from '../createHandleSparkWalletIncomingTransaction';

const walletDescriptor = asWalletDescriptor('wallet-1');
const deviceStaticSessionId = 'device@static-session:1';

const createStore = () => {
    const { reducer: notifications } = createNotificationsReducer();

    return configureStore({
        reducer: { notifications },
        middleware: getDefaultMiddleware =>
            getDefaultMiddleware({
                immutableCheck: false,
                serializableCheck: false,
            }),
    });
};

describe('createHandleSparkWalletIncomingTransaction', () => {
    it('syncs Spark state and then shows a success toast', async () => {
        const store = createStore();
        const syncSparkWalletState = jest.fn().mockResolvedValue(true);
        const handleSparkWalletIncomingTransaction = createHandleSparkWalletIncomingTransaction({
            dispatch: store.dispatch,
            syncSparkWalletState,
        });

        const params: Parameters<typeof handleSparkWalletIncomingTransaction>[0] = {
            accountNumber: 1,
            deviceStaticSessionId,
            runningSparkWallet: {
                wallet: {} as never,
                walletKey: 'wallet-1:1',
            },
            walletDescriptor,
        };

        await handleSparkWalletIncomingTransaction(params);

        expect(syncSparkWalletState).toHaveBeenCalledWith({
            ...params,
            setLoading: false,
        });
        expect(store.getState().notifications).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    context: 'toast',
                    type: 'spark-receive-success',
                }),
            ]),
        );
    });

    it('does not show a success toast when incoming transaction processing fails', async () => {
        const store = createStore();
        const syncSparkWalletState = jest.fn().mockResolvedValue(false);
        const handleSparkWalletIncomingTransaction = createHandleSparkWalletIncomingTransaction({
            dispatch: store.dispatch,
            syncSparkWalletState,
        });

        await handleSparkWalletIncomingTransaction({
            accountNumber: 1,
            deviceStaticSessionId,
            runningSparkWallet: {
                wallet: {} as never,
                walletKey: 'wallet-1:1',
            },
            walletDescriptor,
        });

        expect(syncSparkWalletState).toHaveBeenCalledWith(
            expect.objectContaining({
                setLoading: false,
            }),
        );
        expect(store.getState().notifications).toEqual([]);
    });
});
