import { createReducer } from '@reduxjs/toolkit';

import {
    SuiteSyncAccount,
    SuiteSyncAddress,
    SuiteSyncOutput, SuiteSyncWallet,
} from '@suite-common/suite-sync-storage';
import type { WalletDescriptor } from '@suite-common/wallet-types';

import { labelingActions } from './labelingActions';

export type SuiteSyncWalletsDataState = {
    wallet: SuiteSyncWallet;
    accounts: SuiteSyncAccount[];
    addresses: SuiteSyncAddress[];
    outputs: SuiteSyncOutput[];
};

export type SuiteSyncDataState = {
    wallets: Record<WalletDescriptor, SuiteSyncWalletsDataState>; // key: WalletDescriptor = First btc testnet address
};

export const initialSuiteSyncDataState: SuiteSyncDataState = {
    wallets: {},
};

const getOrCreateWalletsLabelsState = (
    state: SuiteSyncDataState,
    walletDescriptor: WalletDescriptor,
) => {
    const walletLabelState = state.wallets[walletDescriptor];

    if (walletLabelState === undefined) {
        state.wallets[walletDescriptor] = {
            wallet: ,
            accounts: [] as SuiteSyncAccount[],
            addresses: [] as SuiteSyncAddress[],
            outputs: [] as SuiteSyncOutput[],
        };
    }

    return state.wallets[walletDescriptor];
};

export const labelingReducer = createReducer(initialSuiteSyncDataState, builder =>
    builder
        .addCase(labelingActions.setEntity, (state, { payload }) => {
            const walletLabelState = getOrCreateWalletsLabelsState(state, payload.walletDescriptor);

            walletLabelState.wallet = payload.label;
        })
        .addCase(labelingActions.clearAllLabels, (state, { payload }) => {
            delete state.wallets[payload.walletDescriptor];
        }),
);
