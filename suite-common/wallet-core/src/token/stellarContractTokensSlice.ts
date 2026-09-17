import { type PayloadAction } from '@reduxjs/toolkit';

import {
    type ActionTypesDep,
    type ReducersDep,
    createSliceWithExtraDeps,
    returnStableArrayIfEmpty,
} from '@suite-common/redux-utils';
import { type AccountKey } from '@suite-common/wallet-types';

/** Contract tokens the user added by hand, per account; nothing on-chain lists them. */
export interface StellarContractTokensState {
    [accountKey: AccountKey]: string[];
}

/**
 * Contract tokens the account turned out to hold, per account.
 *
 * Nothing on-chain lists these either: they are what `stellarContractBalancesQuery` found by asking
 * every contract the published definitions describe. Kept apart from the list above so that
 * "remove" still means "undo what I added by hand", and remembered across restarts so the first
 * account fetch after one already knows which contracts are worth reading.
 */
export interface StellarDiscoveredContractTokensState {
    [accountKey: AccountKey]: string[];
}

export type StellarContractTokensRootState = {
    wallet: {
        stellarContractTokens: StellarContractTokensState;
        stellarDiscoveredContractTokens: StellarDiscoveredContractTokensState;
    };
};

export const stellarContractTokensInitialState: StellarContractTokensState = {};
export const stellarDiscoveredContractTokensInitialState: StellarDiscoveredContractTokensState = {};

const STELLAR_CONTRACT_TOKENS = '@common/wallet-core/stellar-contract-tokens';
const STELLAR_DISCOVERED_CONTRACT_TOKENS = '@common/wallet-core/stellar-discovered-contract-tokens';

type ContractTokenPayload = { accountKey: AccountKey; contract: string };

type StellarContractTokensDeps = ActionTypesDep<'storageLoad'> &
    ReducersDep<'storageLoadStellarContractTokens'>;

const stellarContractTokensSlice = createSliceWithExtraDeps({
    name: STELLAR_CONTRACT_TOKENS,
    initialState: stellarContractTokensInitialState,
    reducers: {
        addContractToken(
            state: StellarContractTokensState,
            { payload }: PayloadAction<ContractTokenPayload>,
        ) {
            const contracts = state[payload.accountKey] ?? [];

            if (!contracts.includes(payload.contract)) {
                state[payload.accountKey] = [...contracts, payload.contract];
            }
        },
        removeContractToken(
            state: StellarContractTokensState,
            { payload }: PayloadAction<ContractTokenPayload>,
        ) {
            const contracts = state[payload.accountKey];

            if (contracts) {
                state[payload.accountKey] = contracts.filter(
                    contract => contract !== payload.contract,
                );
            }
        },
    },
    extraReducers: (builder, extra: StellarContractTokensDeps) => {
        builder.addCase(
            extra.actionTypes.storageLoad,
            extra.reducers.storageLoadStellarContractTokens,
        );
    },
});

type StellarDiscoveredContractTokensDeps = ActionTypesDep<'storageLoad'> &
    ReducersDep<'storageLoadStellarDiscoveredContractTokens'>;

const stellarDiscoveredContractTokensSlice = createSliceWithExtraDeps({
    name: STELLAR_DISCOVERED_CONTRACT_TOKENS,
    initialState: stellarDiscoveredContractTokensInitialState,
    reducers: {
        setDiscoveredContractTokens(
            state: StellarDiscoveredContractTokensState,
            { payload }: PayloadAction<{ accountKey: AccountKey; contracts: readonly string[] }>,
        ) {
            state[payload.accountKey] = [...payload.contracts];
        },
    },
    extraReducers: (builder, extra: StellarDiscoveredContractTokensDeps) => {
        builder.addCase(
            extra.actionTypes.storageLoad,
            extra.reducers.storageLoadStellarDiscoveredContractTokens,
        );
    },
});

// Read straight from a component, so a fresh array per call would re-render every token row.
export const selectStellarContractTokens = (
    { wallet }: StellarContractTokensRootState,
    accountKey: AccountKey,
): string[] => returnStableArrayIfEmpty(wallet.stellarContractTokens[accountKey]);

export const selectIsStellarContractTokenWatched = (
    { wallet }: StellarContractTokensRootState,
    accountKey: AccountKey,
    contract: string,
): boolean => wallet.stellarContractTokens[accountKey]?.includes(contract) ?? false;

export const selectStellarDiscoveredContractTokens = (
    { wallet }: StellarContractTokensRootState,
    accountKey: AccountKey,
): string[] => returnStableArrayIfEmpty(wallet.stellarDiscoveredContractTokens[accountKey]);

/**
 * Every contract the backend should read for this account: the ones the user added by hand and the
 * ones it was found to hold. Sweeping the rest to find more of them is the query's job.
 */
export const selectStellarContractTokensToRead = (
    state: StellarContractTokensRootState,
    accountKey: AccountKey,
): string[] => {
    const added = selectStellarContractTokens(state, accountKey);
    const discovered = selectStellarDiscoveredContractTokens(state, accountKey);

    if (discovered.length === 0) return added;
    if (added.length === 0) return discovered;

    return [...new Set([...added, ...discovered])];
};

export const stellarContractTokensActions = stellarContractTokensSlice.actions;
export const prepareStellarContractTokensReducer = stellarContractTokensSlice.prepareReducer;
export const stellarDiscoveredContractTokensActions = stellarDiscoveredContractTokensSlice.actions;
export const prepareStellarDiscoveredContractTokensReducer =
    stellarDiscoveredContractTokensSlice.prepareReducer;
