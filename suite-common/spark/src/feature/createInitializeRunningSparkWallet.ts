import {
    SparkWalletEvent,
    type SparkWalletEventType,
    type SparkWalletEvents,
} from '@buildonspark/spark-sdk';
import type { Dispatch } from '@reduxjs/toolkit';

import type { SparkWalletParams } from './createEnsureSparkWallet';
import type {
    RunningSparkWallet,
    RunningSparkWalletRepositoryDep,
} from './createRunningSparkWalletRepository';
import type { SparkWalletSubscriptionStorageDep } from './createSparkWalletSubscriptionStorage';
import type { SyncSparkWalletStateDep } from './createSyncSparkWallet';
import { sparkActions } from './sparkFeatureReducer';
import { initializeSparkWallet } from '../sdk/initializeSparkWallet';

export type InitializeRunningSparkWalletParams = SparkWalletParams & {
    mnemonic: string;
    walletKey: string;
};

export type InitializeRunningSparkWallet = (
    params: InitializeRunningSparkWalletParams,
) => Promise<RunningSparkWallet>;

export type InitializeRunningSparkWalletDep = {
    initializeRunningSparkWallet: InitializeRunningSparkWallet;
};

export type InitializeRunningSparkWalletDeps = {
    dispatch: Dispatch;
} & RunningSparkWalletRepositoryDep &
    SparkWalletSubscriptionStorageDep &
    SyncSparkWalletStateDep;

type SparkWalletEventHandler<TEvent extends SparkWalletEventType = SparkWalletEventType> = (
    ...args: Parameters<SparkWalletEvents[TEvent]>
) => void;

type SparkWalletEventHandlerMap = {
    [TEvent in SparkWalletEventType]: SparkWalletEventHandler<TEvent>;
};

export const createInitializeRunningSparkWallet =
    (deps: InitializeRunningSparkWalletDeps): InitializeRunningSparkWallet =>
    async params => {
        const wallet = await initializeSparkWallet({
            accountNumber: params.accountNumber,
            mnemonic: params.mnemonic,
        });

        const runningSparkWallet: RunningSparkWallet = {
            mnemonic: params.mnemonic,
            wallet,
            walletKey: params.walletKey,
        };

        const eventContext = {
            ...params,
            runningSparkWallet,
        };

        const eventHandlers: SparkWalletEventHandlerMap = {
            [SparkWalletEvent.All]: (_eventName, ..._args) => {},
            [SparkWalletEvent.BalanceUpdate]: _balance => {
                void deps.syncSparkWalletState(eventContext);
            },
            [SparkWalletEvent.TransferClaimed]: () => {
                void deps.syncSparkWalletState(eventContext);
            },
            [SparkWalletEvent.DepositConfirmed]: () => {
                void deps.syncSparkWalletState(eventContext);
            },
            [SparkWalletEvent.StreamConnected]: () => {
                void deps.syncSparkWalletState(eventContext);
            },
            [SparkWalletEvent.StreamDisconnected]: reason => {
                deps.runningSparkWalletRepository.delete(runningSparkWallet.walletKey);
                deps.sparkWalletSubscriptionStorage.dispose(runningSparkWallet.walletKey);
                deps.dispatch(
                    sparkActions.setSparkWalletError({
                        accountNumber: params.accountNumber,
                        error: reason,
                        walletDescriptor: params.walletDescriptor,
                    }),
                );
            },
            [SparkWalletEvent.StreamReconnecting]: () => {},
        };

        wallet.on(SparkWalletEvent.All, eventHandlers[SparkWalletEvent.All]);
        wallet.on(SparkWalletEvent.BalanceUpdate, eventHandlers[SparkWalletEvent.BalanceUpdate]);
        wallet.on(
            SparkWalletEvent.TransferClaimed,
            eventHandlers[SparkWalletEvent.TransferClaimed],
        );
        wallet.on(
            SparkWalletEvent.DepositConfirmed,
            eventHandlers[SparkWalletEvent.DepositConfirmed],
        );
        wallet.on(
            SparkWalletEvent.StreamConnected,
            eventHandlers[SparkWalletEvent.StreamConnected],
        );
        wallet.on(
            SparkWalletEvent.StreamDisconnected,
            eventHandlers[SparkWalletEvent.StreamDisconnected],
        );
        wallet.on(
            SparkWalletEvent.StreamReconnecting,
            eventHandlers[SparkWalletEvent.StreamReconnecting],
        );

        const unsubscribe = () => {
            wallet.off(SparkWalletEvent.All, eventHandlers[SparkWalletEvent.All]);
            wallet.off(
                SparkWalletEvent.BalanceUpdate,
                eventHandlers[SparkWalletEvent.BalanceUpdate],
            );
            wallet.off(
                SparkWalletEvent.TransferClaimed,
                eventHandlers[SparkWalletEvent.TransferClaimed],
            );
            wallet.off(
                SparkWalletEvent.DepositConfirmed,
                eventHandlers[SparkWalletEvent.DepositConfirmed],
            );
            wallet.off(
                SparkWalletEvent.StreamConnected,
                eventHandlers[SparkWalletEvent.StreamConnected],
            );
            wallet.off(
                SparkWalletEvent.StreamDisconnected,
                eventHandlers[SparkWalletEvent.StreamDisconnected],
            );
            wallet.off(
                SparkWalletEvent.StreamReconnecting,
                eventHandlers[SparkWalletEvent.StreamReconnecting],
            );
        };

        deps.sparkWalletSubscriptionStorage.add({
            walletKey: params.walletKey,
            unsubscribe,
        });

        return runningSparkWallet;
    };
