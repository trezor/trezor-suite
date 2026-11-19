import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type Account, type AccountKey } from '@suite-common/wallet-types';
import { getContractAddressForNetworkSymbol } from '@suite-common/wallet-utils';
import { returnStableArrayIfEmpty } from '@trezor/redux-utils';

/** Token contracts the user added by hand, per account, normalized for the account's network. */
export interface CustomTokensState {
    [accountKey: AccountKey]: string[];
}

export type CustomTokensRootState = {
    wallet: {
        customTokens: CustomTokensState;
    };
};

export const customTokensInitialState: CustomTokensState = {};

type CustomTokenPayload = { accountKey: AccountKey; symbol: NetworkSymbol; contract: string };

const customTokensSlice = createSlice({
    name: '@common/wallet-core/custom-tokens',
    initialState: customTokensInitialState,
    reducers: {
        addCustomToken(state, { payload }: PayloadAction<CustomTokenPayload>) {
            const contract = getContractAddressForNetworkSymbol(payload.symbol, payload.contract);
            const contracts = state[payload.accountKey] ?? [];

            if (!contracts.includes(contract)) {
                state[payload.accountKey] = [...contracts, contract];
            }
        },
        removeCustomToken(state, { payload }: PayloadAction<CustomTokenPayload>) {
            const contract = getContractAddressForNetworkSymbol(payload.symbol, payload.contract);
            const contracts = state[payload.accountKey]?.filter(c => c !== contract);

            if (contracts?.length) {
                state[payload.accountKey] = contracts;
            } else {
                delete state[payload.accountKey];
            }
        },
    },
});

export const selectCustomTokenContracts = (
    { wallet }: CustomTokensRootState,
    accountKey: AccountKey,
): string[] => returnStableArrayIfEmpty(wallet.customTokens[accountKey]);

export const selectIsCustomToken = (
    { wallet }: CustomTokensRootState,
    account: Pick<Account, 'key' | 'symbol'>,
    contract: string,
): boolean =>
    wallet.customTokens[account.key]?.includes(
        getContractAddressForNetworkSymbol(account.symbol, contract),
    ) ?? false;

export const customTokensActions = customTokensSlice.actions;
export const customTokensReducer = customTokensSlice.reducer;
