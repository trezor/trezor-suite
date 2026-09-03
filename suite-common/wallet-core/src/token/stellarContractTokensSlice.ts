import { type PayloadAction } from '@reduxjs/toolkit';

import {
    type ActionTypesDep,
    type ReducersDep,
    createSliceWithExtraDeps,
} from '@suite-common/redux-utils';
import { type AccountKey } from '@suite-common/wallet-types';

/**
 * Soroban contract (SEP-41) tokens the user added by hand, per account.
 *
 * Unlike classic assets, a contract token has no trustline to opt into and no on-chain registry
 * to discover holdings from, so the only way an account knows to read one is this list. It is
 * passed to the Stellar worker with every account fetch.
 */
export interface StellarContractTokensState {
    [accountKey: AccountKey]: string[];
}

export type StellarContractTokensRootState = {
    wallet: {
        stellarContractTokens: StellarContractTokensState;
    };
};

export const stellarContractTokensInitialState: StellarContractTokensState = {};

const STELLAR_CONTRACT_TOKENS = '@common/wallet-core/stellar-contract-tokens';

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

export const selectStellarContractTokens = (
    { wallet }: StellarContractTokensRootState,
    accountKey: AccountKey,
): string[] => wallet.stellarContractTokens[accountKey] ?? [];

export const stellarContractTokensActions = stellarContractTokensSlice.actions;
export const prepareStellarContractTokensReducer = stellarContractTokensSlice.prepareReducer;
