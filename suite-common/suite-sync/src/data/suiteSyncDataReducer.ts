import { EntityState, PayloadAction, createEntityAdapter, createSlice } from '@reduxjs/toolkit';

import {
    SuiteSyncAccount,
    SuiteSyncAddress,
    SuiteSyncOutput,
    SuiteSyncWallet,
} from '@suite-common/suite-sync-storage';
import type { WalletDescriptor } from '@suite-common/wallet-types';

export const accountsAdapter = createEntityAdapter<SuiteSyncAccount, string>({
    selectId: account => account.id,
});

export const addressesAdapter = createEntityAdapter<SuiteSyncAddress, string>({
    selectId: address => address.address,
});

export const outputsAdapter = createEntityAdapter<SuiteSyncOutput, string>({
    selectId: output => output.id,
});

export type WalletData = {
    wallet: SuiteSyncWallet;
    accounts: EntityState<SuiteSyncAccount, string>;
    addresses: EntityState<SuiteSyncAddress, string>;
    outputs: EntityState<SuiteSyncOutput, string>;
};

export const walletsAdapter = createEntityAdapter<WalletData, WalletDescriptor>({
    selectId: walletData => walletData.wallet.walletDescriptor,
});

export type SuiteSyncDataState = EntityState<WalletData, WalletDescriptor>;

const initialState: SuiteSyncDataState = walletsAdapter.getInitialState();

const ensureWallet = (
    state: SuiteSyncDataState,
    walletDescriptor: WalletDescriptor,
): WalletData => {
    const existing = state.entities[walletDescriptor];

    if (existing) {
        return existing;
    }

    const newWallet: WalletData = {
        wallet: {
            walletDescriptor,
            label: null,
        },
        accounts: accountsAdapter.getInitialState(),
        addresses: addressesAdapter.getInitialState(),
        outputs: outputsAdapter.getInitialState(),
    };
    walletsAdapter.upsertOne(state, newWallet);

    return state.entities[walletDescriptor]!;
};

export const suiteSyncDataSlice = createSlice({
    name: 'suiteSyncData',
    initialState,
    reducers: {
        upsertManyWallets: (state, action: PayloadAction<SuiteSyncWallet[]>) => {
            action.payload.forEach(wallet => {
                const existing = state.entities[wallet.walletDescriptor];

                walletsAdapter.upsertOne(state, {
                    wallet,
                    accounts: existing?.accounts ?? accountsAdapter.getInitialState(),
                    addresses: existing?.addresses ?? addressesAdapter.getInitialState(),
                    outputs: existing?.outputs ?? outputsAdapter.getInitialState(),
                });
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
                accountsAdapter.upsertOne(wallet.accounts, account);
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
                addressesAdapter.upsertOne(wallet.addresses, address);
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
                outputsAdapter.upsertOne(wallet.outputs, output);
            });
        },

        clearAll: () => initialState,
    },
});

export const {
    upsertManyWallets,
    upsertManyAccounts,
    upsertManyAddresses,
    upsertManyOutputs,
    clearAll,
} = suiteSyncDataSlice.actions;

export const suiteSyncDataReducer = suiteSyncDataSlice.reducer;

export type SuiteSyncDataRootState = { suiteSyncData: SuiteSyncDataState };
