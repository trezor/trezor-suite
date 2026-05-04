import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

import type { WalletDescriptor } from '@suite-common/wallet-types';

import { type SparkAccount, createSparkWalletKey } from '../accounts/sparkAccounts';

export type SparkWalletStatus = 'idle' | 'loading' | 'loaded' | 'error';

export type SparkTransfer = {
    amountSats: string;
    counterparty: string;
    createdAt: string;
    direction: 'send' | 'receive';
    id: string;
    rail: 'bitcoin' | 'lightning' | 'spark';
    status: string;
    summary: string;
};

export type SparkWalletState = {
    accountNumber: number;
    balanceSats: string | null;
    bitcoinDepositAddress: string;
    error: string | null;
    lastLoadedAt: number | null;
    lightningInvoice: string;
    status: SparkWalletStatus;
    transfers: SparkTransfer[];
    walletDescriptor: WalletDescriptor;
    walletKey: string;
};

export type SparkState = {
    accountsByWalletDescriptor: Record<WalletDescriptor, SparkAccount[]>;
    isEnabled: boolean;
    selectedAccountNumberByWalletDescriptor: Record<WalletDescriptor, number | undefined>;
    walletsByKey: Record<string, SparkWalletState>;
};

const createSparkWalletState = ({
    accountNumber,
    walletDescriptor,
}: {
    accountNumber: number;
    walletDescriptor: WalletDescriptor;
}): SparkWalletState => ({
    accountNumber,
    balanceSats: null,
    bitcoinDepositAddress: '',
    error: null,
    lastLoadedAt: null,
    lightningInvoice: '',
    status: 'idle',
    transfers: [],
    walletDescriptor,
    walletKey: createSparkWalletKey({ accountNumber, walletDescriptor }),
});

export const initialSparkState: SparkState = {
    accountsByWalletDescriptor: {},
    isEnabled: false,
    selectedAccountNumberByWalletDescriptor: {},
    walletsByKey: {},
};

const sparkFeatureSlice = createSlice({
    name: '@suite-common/spark',
    initialState: initialSparkState,
    reducers: {
        setSparkEnabled: (state, action: PayloadAction<boolean>) => {
            state.isEnabled = action.payload;
        },
        addSparkAccount: (
            state,
            action: PayloadAction<{
                accountNumber: number;
                walletDescriptor: WalletDescriptor;
            }>,
        ) => {
            const { accountNumber, walletDescriptor } = action.payload;
            const walletKey = createSparkWalletKey({ accountNumber, walletDescriptor });
            const existingAccounts = state.accountsByWalletDescriptor[walletDescriptor] ?? [];
            const hasAccount = existingAccounts.some(
                account => account.accountNumber === accountNumber,
            );

            if (!hasAccount) {
                const nextAccount: SparkAccount = {
                    accountNumber,
                    walletDescriptor,
                    walletKey,
                };

                state.accountsByWalletDescriptor[walletDescriptor] = [
                    ...existingAccounts,
                    nextAccount,
                ].toSorted(
                    (leftAccount, rightAccount) =>
                        leftAccount.accountNumber - rightAccount.accountNumber,
                );
            }

            if (state.selectedAccountNumberByWalletDescriptor[walletDescriptor] === undefined) {
                state.selectedAccountNumberByWalletDescriptor[walletDescriptor] = accountNumber;
            }

            if (state.walletsByKey[walletKey] === undefined) {
                state.walletsByKey[walletKey] = createSparkWalletState({
                    accountNumber,
                    walletDescriptor,
                });
            }
        },
        selectSparkAccount: (
            state,
            action: PayloadAction<{
                accountNumber: number;
                walletDescriptor: WalletDescriptor;
            }>,
        ) => {
            state.selectedAccountNumberByWalletDescriptor[action.payload.walletDescriptor] =
                action.payload.accountNumber;
        },
        setSparkWalletLoading: (
            state,
            action: PayloadAction<{
                accountNumber: number;
                walletDescriptor: WalletDescriptor;
            }>,
        ) => {
            const walletKey = createSparkWalletKey(action.payload);
            const walletState =
                state.walletsByKey[walletKey] ?? createSparkWalletState(action.payload);

            walletState.error = null;
            walletState.status = 'loading';

            state.walletsByKey[walletKey] = walletState;
        },
        setSparkWalletReceiveDetails: (
            state,
            action: PayloadAction<{
                accountNumber: number;
                bitcoinDepositAddress: string;
                lightningInvoice: string;
                walletDescriptor: WalletDescriptor;
            }>,
        ) => {
            const walletKey = createSparkWalletKey(action.payload);
            const walletState =
                state.walletsByKey[walletKey] ?? createSparkWalletState(action.payload);

            walletState.bitcoinDepositAddress = action.payload.bitcoinDepositAddress;
            walletState.lightningInvoice = action.payload.lightningInvoice;

            state.walletsByKey[walletKey] = walletState;
        },
        setSparkWalletLoaded: (
            state,
            action: PayloadAction<{
                accountNumber: number;
                balanceSats: string | null;
                bitcoinDepositAddress?: string;
                lightningInvoice?: string;
                transfers?: SparkTransfer[];
                walletDescriptor: WalletDescriptor;
            }>,
        ) => {
            const walletKey = createSparkWalletKey(action.payload);
            const walletState =
                state.walletsByKey[walletKey] ?? createSparkWalletState(action.payload);

            walletState.balanceSats = action.payload.balanceSats;
            walletState.bitcoinDepositAddress =
                action.payload.bitcoinDepositAddress ?? walletState.bitcoinDepositAddress;
            walletState.error = null;
            walletState.lastLoadedAt = Date.now();
            walletState.lightningInvoice =
                action.payload.lightningInvoice ?? walletState.lightningInvoice;
            walletState.status = 'loaded';
            walletState.transfers = action.payload.transfers ?? walletState.transfers;

            state.walletsByKey[walletKey] = walletState;
        },
        setSparkWalletError: (
            state,
            action: PayloadAction<{
                accountNumber: number;
                error: string;
                walletDescriptor: WalletDescriptor;
            }>,
        ) => {
            const walletKey = createSparkWalletKey(action.payload);
            const walletState =
                state.walletsByKey[walletKey] ?? createSparkWalletState(action.payload);

            walletState.error = action.payload.error;
            walletState.status = 'error';

            state.walletsByKey[walletKey] = walletState;
        },
        clearSparkWalletError: (
            state,
            action: PayloadAction<{
                accountNumber: number;
                walletDescriptor: WalletDescriptor;
            }>,
        ) => {
            const walletKey = createSparkWalletKey(action.payload);
            const walletState =
                state.walletsByKey[walletKey] ?? createSparkWalletState(action.payload);

            walletState.error = null;

            state.walletsByKey[walletKey] = walletState;
        },
    },
});

export const sparkReducer = sparkFeatureSlice.reducer;
export const sparkActions = sparkFeatureSlice.actions;
