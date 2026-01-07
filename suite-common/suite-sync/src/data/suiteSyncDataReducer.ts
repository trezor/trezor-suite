import { EntityState, PayloadAction, createEntityAdapter, createSlice } from '@reduxjs/toolkit';

import {
    SuiteSyncAccount,
    SuiteSyncAddress,
    SuiteSyncOutput,
    SuiteSyncWallet,
} from '@suite-common/suite-sync-storage';
import type { NetworkSymbol } from '@suite-common/wallet-config';
import type { AccountDescriptor, WalletDescriptor } from '@suite-common/wallet-types';

export const createAccountId = (
    accountDescriptor: AccountDescriptor,
    networkSymbol: NetworkSymbol,
) => `${accountDescriptor}-${networkSymbol}`;

export const createOutputId = (txId: string, outputIndex: number) => `${txId}-${outputIndex}`;

export type AccountWithId = SuiteSyncAccount & { id: string };
export type OutputWithId = SuiteSyncOutput & { id: string };

export const accountsAdapter = createEntityAdapter<AccountWithId, string>({
    selectId: account => account.id,
});

export const addressesAdapter = createEntityAdapter<SuiteSyncAddress, string>({
    selectId: address => address.address,
});

export const outputsAdapter = createEntityAdapter<OutputWithId, string>({
    selectId: output => output.id,
});

export type WalletData = {
    wallet: SuiteSyncWallet;
    accounts: EntityState<AccountWithId, string>;
    addresses: EntityState<SuiteSyncAddress, string>;
    outputs: EntityState<OutputWithId, string>;
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
        setWallet: (state, action: PayloadAction<SuiteSyncWallet>) => {
            const existing = state.entities[action.payload.walletDescriptor];
            const walletData: WalletData = {
                wallet: action.payload,
                accounts: existing?.accounts ?? accountsAdapter.getInitialState(),
                addresses: existing?.addresses ?? addressesAdapter.getInitialState(),
                outputs: existing?.outputs ?? outputsAdapter.getInitialState(),
            };
            walletsAdapter.upsertOne(state, walletData);
        },

        addManyAccounts: (
            state,
            action: PayloadAction<{
                walletDescriptor: WalletDescriptor;
                accounts: SuiteSyncAccount[];
            }>,
        ) => {
            const wallet = ensureWallet(state, action.payload.walletDescriptor);
            action.payload.accounts.forEach(account => {
                const accountWithId: AccountWithId = {
                    ...account,
                    id: createAccountId(account.accountDescriptor, account.networkSymbol),
                };
                accountsAdapter.upsertOne(wallet.accounts, accountWithId);
            });
        },
        addManyAddresses: (
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

        addManyOutputs: (
            state,
            action: PayloadAction<{
                walletDescriptor: WalletDescriptor;
                outputs: SuiteSyncOutput[];
            }>,
        ) => {
            const wallet = ensureWallet(state, action.payload.walletDescriptor);
            action.payload.outputs.forEach(output => {
                const outputWithId: OutputWithId = {
                    ...output,
                    id: createOutputId(output.txId, output.outputIndex),
                };
                outputsAdapter.upsertOne(wallet.outputs, outputWithId);
            });
        },

        clearAll: () => initialState,
    },
});

export const { setWallet, addManyAccounts, addManyAddresses, addManyOutputs, clearAll } =
    suiteSyncDataSlice.actions;

export const suiteSyncDataReducer = suiteSyncDataSlice.reducer;

export type SuiteSyncDataRootState = { suiteSyncData: SuiteSyncDataState };
