import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type Account, type AccountKey } from '@suite-common/wallet-types';
import { getContractAddressForNetworkSymbol } from '@suite-common/wallet-utils';
import { returnStableArrayIfEmpty } from '@trezor/redux-utils';

export type CustomToken = {
    /** Normalized for the account's network. */
    contract: string;
    /** Unix time in milliseconds. */
    addedAt: number;
};

/** Tokens the user added by hand, per account. */
export interface CustomTokensState {
    [accountKey: AccountKey]: CustomToken[];
}

export type CustomTokensRootState = {
    wallet: {
        customTokens: CustomTokensState;
    };
};

export const customTokensInitialState: CustomTokensState = {};

type CustomTokenPayload = { accountKey: AccountKey; symbol: NetworkSymbol; contract: string };

const findCustomToken = (
    tokens: CustomToken[] | undefined,
    symbol: NetworkSymbol,
    contract: string,
) => {
    const normalized = getContractAddressForNetworkSymbol(symbol, contract);

    return tokens?.find(token => token.contract === normalized);
};

const customTokensSlice = createSlice({
    name: '@common/wallet-core/custom-tokens',
    initialState: customTokensInitialState,
    reducers: {
        addCustomToken(
            state,
            { payload }: PayloadAction<CustomTokenPayload & { addedAt: number }>,
        ) {
            const tokens = state[payload.accountKey] ?? [];
            if (findCustomToken(tokens, payload.symbol, payload.contract)) return;

            state[payload.accountKey] = [
                ...tokens,
                {
                    contract: getContractAddressForNetworkSymbol(payload.symbol, payload.contract),
                    addedAt: payload.addedAt,
                },
            ];
        },
        removeCustomToken(state, { payload }: PayloadAction<CustomTokenPayload>) {
            const contract = getContractAddressForNetworkSymbol(payload.symbol, payload.contract);
            const tokens = state[payload.accountKey]?.filter(token => token.contract !== contract);

            if (tokens?.length) {
                state[payload.accountKey] = tokens;
            } else {
                delete state[payload.accountKey];
            }
        },
    },
});

/** Returns a new array on every call; not for use with `useSelector`. */
export const selectCustomTokenContracts = (
    { wallet }: CustomTokensRootState,
    accountKey: AccountKey,
): string[] =>
    returnStableArrayIfEmpty(wallet.customTokens[accountKey]?.map(token => token.contract));

export const selectCustomToken = (
    { wallet }: CustomTokensRootState,
    account: Pick<Account, 'key' | 'symbol'>,
    contract: string,
): CustomToken | undefined =>
    findCustomToken(wallet.customTokens[account.key], account.symbol, contract);

export const selectIsCustomToken = (
    state: CustomTokensRootState,
    account: Pick<Account, 'key' | 'symbol'>,
    contract: string,
): boolean => !!selectCustomToken(state, account, contract);

export const customTokensActions = customTokensSlice.actions;
export const customTokensReducer = customTokensSlice.reducer;
