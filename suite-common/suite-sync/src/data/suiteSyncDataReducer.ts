import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

import {
    type SuiteSyncAccount,
    type SuiteSyncAddress,
    type SuiteSyncOutput,
    type SuiteSyncWallet,
} from '@suite-common/suite-sync-storage';
import type { WalletDescriptor } from '@suite-common/wallet-types';

export type WalletData = {
    wallet: SuiteSyncWallet;
    accounts: Record<SuiteSyncAccount['id'], SuiteSyncAccount>;
    addresses: Record<SuiteSyncAddress['address'], SuiteSyncAddress>;
    outputs: Record<SuiteSyncOutput['id'], SuiteSyncOutput>;
};

export type SuiteSyncDataState = {
    wallets: Record<WalletDescriptor, WalletData>;
};

export const initialSuiteSyncDataState: SuiteSyncDataState = {
    wallets: {},
};

const ensureWallet = (
    state: SuiteSyncDataState,
    walletDescriptor: WalletDescriptor,
): WalletData => {
    if (!state.wallets[walletDescriptor]) {
        state.wallets[walletDescriptor] = {
            wallet: {
                walletDescriptor,
                label: null,
            },
            accounts: {},
            addresses: {},
            outputs: {},
        };
    }

    return state.wallets[walletDescriptor]!;
};

export const suiteSyncDataSlice = createSlice({
    name: 'suiteSyncData',
    initialState: initialSuiteSyncDataState,
    reducers: {
        upsertManyWallets: (state, action: PayloadAction<SuiteSyncWallet[]>) => {
            action.payload.forEach(wallet => {
                const existing = state.wallets[wallet.walletDescriptor];

                state.wallets[wallet.walletDescriptor] = {
                    wallet,
                    accounts: existing?.accounts ?? {},
                    addresses: existing?.addresses ?? {},
                    outputs: existing?.outputs ?? {},
                };
            });
        },

        upsertManyAccounts: (
            state,
            action: PayloadAction<{
                walletDescriptor: WalletDescriptor;
                accounts: SuiteSyncAccount[];
            }>,
        ) => {
            const wallet = ensureWallet(state, action.payload.walletDescriptor);

            action.payload.accounts.forEach(account => {
                wallet.accounts[account.id] = account;
            });
        },

        upsertManyAddresses: (
            state,
            action: PayloadAction<{
                walletDescriptor: WalletDescriptor;
                addresses: SuiteSyncAddress[];
            }>,
        ) => {
            const wallet = ensureWallet(state, action.payload.walletDescriptor);

            action.payload.addresses.forEach(address => {
                wallet.addresses[address.address] = address;
            });
        },

        upsertManyOutputs: (
            state,
            action: PayloadAction<{
                walletDescriptor: WalletDescriptor;
                outputs: SuiteSyncOutput[];
            }>,
        ) => {
            const wallet = ensureWallet(state, action.payload.walletDescriptor);

            action.payload.outputs.forEach(output => {
                wallet.outputs[output.id] = output;
            });
        },

        clearDataForWallet: (state, action: PayloadAction<WalletDescriptor>) => {
            delete state.wallets[action.payload];
        },

        clearAll: () => initialSuiteSyncDataState,
    },
});

export const {
    upsertManyWallets,
    upsertManyAccounts,
    upsertManyAddresses,
    upsertManyOutputs,
    clearDataForWallet,
    clearAll,
} = suiteSyncDataSlice.actions;

export const suiteSyncDataReducer = suiteSyncDataSlice.reducer;

export type SuiteSyncDataRootState = { suiteSyncData: SuiteSyncDataState };
