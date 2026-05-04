import {
    SparkWalletEvent,
    type SparkWalletEventType,
    type SparkWalletEvents,
} from '@buildonspark/spark-sdk';
import { configureStore } from '@reduxjs/toolkit';

import { createFakeSparkSigner } from '@suite-common/spark-fake-signer';
import { asSuiteSyncOwnerSecretHex } from '@suite-common/suite-sync-storage';
import { createNotificationsReducer } from '@suite-common/toast-notifications';
import { asWalletDescriptor } from '@suite-common/wallet-types';

import { initializeSparkWallet } from '../../sdk/initializeSparkWallet';
import { createInitializeRunningSparkWallet } from '../createInitializeRunningSparkWallet';

jest.mock('@suite-common/spark-fake-signer', () => ({
    createFakeSparkSigner: jest.fn(),
}));

jest.mock('../../sdk/initializeSparkWallet', () => ({
    initializeSparkWallet: jest.fn(),
}));

const walletDescriptor = asWalletDescriptor('wallet-1');
const deviceStaticSessionId = 'device@static-session:1';
const trezorSecret = asSuiteSyncOwnerSecretHex(
    '4a8b2c1d5e6f708192a3b4c5d6e7f80911223344556677889900aabbccddeeff',
);

type RegisteredSparkWalletEvents = Partial<{
    [TEvent in SparkWalletEventType]: SparkWalletEvents[TEvent];
}>;

const createStore = () => {
    const { reducer: notifications } = createNotificationsReducer();

    return configureStore({
        reducer: { notifications },
        middleware: getDefaultMiddleware =>
            getDefaultMiddleware({
                thunk: {
                    extraArgument: {},
                },
                immutableCheck: false,
                serializableCheck: false,
            }),
    });
};

const createMockWallet = () => {
    const registeredEvents: RegisteredSparkWalletEvents = {};

    const wallet = {
        off: jest.fn(
            <TEvent extends SparkWalletEventType>(
                eventName: TEvent,
                eventHandler: SparkWalletEvents[TEvent],
            ) => {
                if (registeredEvents[eventName] === eventHandler) {
                    delete registeredEvents[eventName];
                }
            },
        ),
        on: jest.fn(
            <TEvent extends SparkWalletEventType>(
                eventName: TEvent,
                eventHandler: SparkWalletEvents[TEvent],
            ) => {
                registeredEvents[eventName] = eventHandler;
            },
        ),
    };

    return {
        registeredEvents,
        wallet,
    };
};

describe('createInitializeRunningSparkWallet', () => {
    const createFakeSparkSignerMock = jest.mocked(createFakeSparkSigner);
    const initializeSparkWalletMock = jest.mocked(initializeSparkWallet);
    let fakeSparkSignerFactory: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();

        fakeSparkSignerFactory = jest.fn().mockResolvedValue('signer' as never);
        createFakeSparkSignerMock.mockReturnValue(fakeSparkSignerFactory as never);
    });

    it('delegates transfer-claimed events to the incoming transaction handler', async () => {
        const store = createStore();
        const handleSparkWalletIncomingTransaction = jest.fn();
        const syncSparkWalletState = jest.fn();
        const runningSparkWalletRepository = {
            delete: jest.fn(),
            get: jest.fn(),
            set: jest.fn(),
        };
        const sparkWalletSubscriptionStorage = {
            add: jest.fn(),
            dispose: jest.fn(),
            has: jest.fn(),
        };
        const { registeredEvents, wallet } = createMockWallet();

        initializeSparkWalletMock.mockResolvedValue(wallet as never);

        const initializeRunningSparkWallet = createInitializeRunningSparkWallet({
            createFakeSparkSigner: fakeSparkSignerFactory,
            dispatch: store.dispatch,
            handleSparkWalletIncomingTransaction,
            runningSparkWalletRepository,
            sparkWalletSubscriptionStorage,
            syncSparkWalletState,
        });

        await initializeRunningSparkWallet({
            accountNumber: 1,
            deviceStaticSessionId,
            trezorSecret,
            walletDescriptor,
            walletKey: 'wallet-1:1',
        });

        expect(fakeSparkSignerFactory).toHaveBeenCalledWith({
            accountNumber: 1,
            trezorSecret,
        });
        expect(initializeSparkWalletMock).toHaveBeenCalledWith({
            accountNumber: 1,
            signer: 'signer',
        });

        registeredEvents[SparkWalletEvent.TransferClaimed]?.('transfer-id', 1n);

        expect(handleSparkWalletIncomingTransaction).toHaveBeenCalledWith({
            accountNumber: 1,
            deviceStaticSessionId,
            runningSparkWallet: {
                wallet,
                walletKey: 'wallet-1:1',
            },
            walletDescriptor,
        });
        expect(syncSparkWalletState).not.toHaveBeenCalled();
    });

    it('delegates deposit-confirmed events to the incoming transaction handler', async () => {
        const store = createStore();
        const handleSparkWalletIncomingTransaction = jest.fn();
        const syncSparkWalletState = jest.fn();
        const { registeredEvents, wallet } = createMockWallet();

        initializeSparkWalletMock.mockResolvedValue(wallet as never);

        const initializeRunningSparkWallet = createInitializeRunningSparkWallet({
            createFakeSparkSigner: fakeSparkSignerFactory,
            dispatch: store.dispatch,
            handleSparkWalletIncomingTransaction,
            runningSparkWalletRepository: {
                delete: jest.fn(),
                get: jest.fn(),
                set: jest.fn(),
            },
            sparkWalletSubscriptionStorage: {
                add: jest.fn(),
                dispose: jest.fn(),
                has: jest.fn(),
            },
            syncSparkWalletState,
        });

        await initializeRunningSparkWallet({
            accountNumber: 1,
            deviceStaticSessionId,
            trezorSecret,
            walletDescriptor,
            walletKey: 'wallet-1:1',
        });

        registeredEvents[SparkWalletEvent.DepositConfirmed]?.('transfer-id', 1n);

        expect(handleSparkWalletIncomingTransaction).toHaveBeenCalledWith({
            accountNumber: 1,
            deviceStaticSessionId,
            runningSparkWallet: {
                wallet,
                walletKey: 'wallet-1:1',
            },
            walletDescriptor,
        });
    });

    it('ignores balance updates from the subscription stream', async () => {
        const store = createStore();
        const syncSparkWalletState = jest.fn();
        const { registeredEvents, wallet } = createMockWallet();

        initializeSparkWalletMock.mockResolvedValue(wallet as never);

        const initializeRunningSparkWallet = createInitializeRunningSparkWallet({
            createFakeSparkSigner: fakeSparkSignerFactory,
            dispatch: store.dispatch,
            handleSparkWalletIncomingTransaction: jest.fn(),
            runningSparkWalletRepository: {
                delete: jest.fn(),
                get: jest.fn(),
                set: jest.fn(),
            },
            sparkWalletSubscriptionStorage: {
                add: jest.fn(),
                dispose: jest.fn(),
                has: jest.fn(),
            },
            syncSparkWalletState,
        });

        await initializeRunningSparkWallet({
            accountNumber: 1,
            deviceStaticSessionId,
            trezorSecret,
            walletDescriptor,
            walletKey: 'wallet-1:1',
        });

        registeredEvents[SparkWalletEvent.BalanceUpdate]?.('1' as never);

        expect(syncSparkWalletState).not.toHaveBeenCalled();
        expect(store.getState().notifications).toEqual([]);
    });

    it('keeps syncing wallet state when the stream reconnects successfully', async () => {
        const store = createStore();
        const syncSparkWalletState = jest.fn();
        const { registeredEvents, wallet } = createMockWallet();

        initializeSparkWalletMock.mockResolvedValue(wallet as never);

        const initializeRunningSparkWallet = createInitializeRunningSparkWallet({
            createFakeSparkSigner: fakeSparkSignerFactory,
            dispatch: store.dispatch,
            handleSparkWalletIncomingTransaction: jest.fn(),
            runningSparkWalletRepository: {
                delete: jest.fn(),
                get: jest.fn(),
                set: jest.fn(),
            },
            sparkWalletSubscriptionStorage: {
                add: jest.fn(),
                dispose: jest.fn(),
                has: jest.fn(),
            },
            syncSparkWalletState,
        });

        const runningSparkWallet = await initializeRunningSparkWallet({
            accountNumber: 1,
            deviceStaticSessionId,
            trezorSecret,
            walletDescriptor,
            walletKey: 'wallet-1:1',
        });

        registeredEvents[SparkWalletEvent.StreamConnected]?.();

        expect(syncSparkWalletState).toHaveBeenCalledWith({
            accountNumber: 1,
            deviceStaticSessionId,
            runningSparkWallet,
            walletDescriptor,
        });
    });
});
