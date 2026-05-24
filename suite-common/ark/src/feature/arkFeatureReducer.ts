import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

import type { WalletDescriptor } from '@suite-common/wallet-types';

import { type ArkAccount, createArkWalletKey } from '../accounts/arkAccounts';

export type ArkWalletStatus = 'idle' | 'loading' | 'loaded' | 'error';

// Serializable projection of `WalletBalance` from `@arkade-os/sdk`.
// The SDK ships `bigint` for the asset list which is not Redux-friendly;
// we drop the asset list at v0 and only carry sat-denominated fields.
export type ArkBalance = {
    available: number;
    settled: number;
    preconfirmed: number;
    boardingConfirmed: number;
    boardingUnconfirmed: number;
    recoverable: number;
    total: number;
};

// Serializable projection of `VirtualCoin` from `@arkade-os/sdk`. The
// lifecycle predicates exposed by the SDK as methods are flattened to
// booleans so the history view can render straight from state.
export type ArkVtxoView = {
    txid: string;
    vout: number;
    amountSats: number;
    isSpendable: boolean;
    isRecoverable: boolean;
    isExpired: boolean;
    isSubdust: boolean;
};

export type ArkWalletState = {
    accountNumber: number;
    balance: ArkBalance | null;
    boardingAddress: string;
    error: string | null;
    lastLoadedAt: number | null;
    offchainAddress: string;
    status: ArkWalletStatus;
    vtxos: ArkVtxoView[];
    walletDescriptor: WalletDescriptor;
    walletKey: string;
};

export type ArkState = {
    accountsByWalletDescriptor: Record<WalletDescriptor, ArkAccount[]>;
    isEnabled: boolean;
    selectedAccountNumberByWalletDescriptor: Record<WalletDescriptor, number | undefined>;
    walletsByKey: Record<string, ArkWalletState>;
};

const createArkWalletState = ({
    accountNumber,
    walletDescriptor,
}: {
    accountNumber: number;
    walletDescriptor: WalletDescriptor;
}): ArkWalletState => ({
    accountNumber,
    balance: null,
    boardingAddress: '',
    error: null,
    lastLoadedAt: null,
    offchainAddress: '',
    status: 'idle',
    vtxos: [],
    walletDescriptor,
    walletKey: createArkWalletKey({ accountNumber, walletDescriptor }),
});

export const initialArkState: ArkState = {
    accountsByWalletDescriptor: {},
    isEnabled: true,
    selectedAccountNumberByWalletDescriptor: {},
    walletsByKey: {},
};

const arkFeatureSlice = createSlice({
    name: '@suite-common/ark',
    initialState: initialArkState,
    reducers: {
        setArkEnabled: (state, action: PayloadAction<boolean>) => {
            state.isEnabled = action.payload;
        },
        addArkAccount: (
            state,
            action: PayloadAction<{
                accountNumber: number;
                walletDescriptor: WalletDescriptor;
            }>,
        ) => {
            const { accountNumber, walletDescriptor } = action.payload;
            const walletKey = createArkWalletKey({ accountNumber, walletDescriptor });
            const existingAccounts = state.accountsByWalletDescriptor[walletDescriptor] ?? [];
            const hasAccount = existingAccounts.some(
                account => account.accountNumber === accountNumber,
            );

            if (!hasAccount) {
                const nextAccount: ArkAccount = {
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
                state.walletsByKey[walletKey] = createArkWalletState({
                    accountNumber,
                    walletDescriptor,
                });
            }
        },
        selectArkAccount: (
            state,
            action: PayloadAction<{
                accountNumber: number;
                walletDescriptor: WalletDescriptor;
            }>,
        ) => {
            state.selectedAccountNumberByWalletDescriptor[action.payload.walletDescriptor] =
                action.payload.accountNumber;
        },
        setArkWalletLoading: (
            state,
            action: PayloadAction<{
                accountNumber: number;
                walletDescriptor: WalletDescriptor;
            }>,
        ) => {
            const walletKey = createArkWalletKey(action.payload);
            const walletState =
                state.walletsByKey[walletKey] ?? createArkWalletState(action.payload);

            walletState.error = null;
            walletState.status = 'loading';

            state.walletsByKey[walletKey] = walletState;
        },
        setArkWalletReceiveDetails: (
            state,
            action: PayloadAction<{
                accountNumber: number;
                boardingAddress: string;
                offchainAddress: string;
                walletDescriptor: WalletDescriptor;
            }>,
        ) => {
            const walletKey = createArkWalletKey(action.payload);
            const walletState =
                state.walletsByKey[walletKey] ?? createArkWalletState(action.payload);

            walletState.boardingAddress = action.payload.boardingAddress;
            walletState.offchainAddress = action.payload.offchainAddress;

            state.walletsByKey[walletKey] = walletState;
        },
        setArkWalletLoaded: (
            state,
            action: PayloadAction<{
                accountNumber: number;
                balance: ArkBalance | null;
                boardingAddress?: string;
                offchainAddress?: string;
                vtxos?: ArkVtxoView[];
                walletDescriptor: WalletDescriptor;
            }>,
        ) => {
            const walletKey = createArkWalletKey(action.payload);
            const walletState =
                state.walletsByKey[walletKey] ?? createArkWalletState(action.payload);

            walletState.balance = action.payload.balance;
            walletState.boardingAddress =
                action.payload.boardingAddress ?? walletState.boardingAddress;
            walletState.error = null;
            walletState.lastLoadedAt = Date.now();
            walletState.offchainAddress =
                action.payload.offchainAddress ?? walletState.offchainAddress;
            walletState.status = 'loaded';
            walletState.vtxos = action.payload.vtxos ?? walletState.vtxos;

            state.walletsByKey[walletKey] = walletState;
        },
        setArkWalletError: (
            state,
            action: PayloadAction<{
                accountNumber: number;
                error: string;
                walletDescriptor: WalletDescriptor;
            }>,
        ) => {
            const walletKey = createArkWalletKey(action.payload);
            const walletState =
                state.walletsByKey[walletKey] ?? createArkWalletState(action.payload);

            walletState.error = action.payload.error;
            walletState.status = 'error';

            state.walletsByKey[walletKey] = walletState;
        },
        clearArkWalletError: (
            state,
            action: PayloadAction<{
                accountNumber: number;
                walletDescriptor: WalletDescriptor;
            }>,
        ) => {
            const walletKey = createArkWalletKey(action.payload);
            const walletState =
                state.walletsByKey[walletKey] ?? createArkWalletState(action.payload);

            walletState.error = null;

            state.walletsByKey[walletKey] = walletState;
        },
    },
});

export const arkReducer = arkFeatureSlice.reducer;
export const arkActions = arkFeatureSlice.actions;
