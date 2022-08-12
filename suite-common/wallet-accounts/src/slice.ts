import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

import { AccountInfo } from '@trezor/connect';
import { Account, DiscoveryItem } from '@suite-common/wallet-types';
import {
    enhanceAddresses,
    enhanceTokens,
    enhanceUtxo,
    formatNetworkAmount,
    getAccountKey,
    getAccountSpecific,
} from '@suite-common/wallet-utils';
import { ACCOUNT } from '@trezor/suite/libDev/src/actions/wallet/constants';

export type AccountsState = Account;

type SliceState = {
    accounts: Account[];
};

const initialState: Account[] = [];

const accountEqualTo = (b: Account) => (a: Account) =>
    a.deviceState === b.deviceState && a.descriptor === b.descriptor && a.symbol === b.symbol;

const update = (state: AccountsState[], account: Account) => {
    const accountIndex = state.findIndex(accountEqualTo(account));

    if (accountIndex !== -1) {
        state[accountIndex] = account;

        if (!account.marker) {
            // immer.js doesn't update fields that are set to undefined, so instead we delete the field
            delete state[accountIndex].marker;
        }
    } else {
        console.warn(
            `Tried to update account that does not exist: ${account.descriptor} (symbol: ${account.symbol})`,
        );
    }
};

export const accountsSlice = createSlice({
    name: 'accounts',
    initialState,
    reducers: {
        create: {
            reducer: (state, action: PayloadAction<Account>) => {
                // TODO: check if account already exist, for example 2 device instances with same passphrase
                // remove "transactions" field, they are stored in "transactionReducer"
                const account = action.payload;
                if (account.history) {
                    delete account.history.transactions;
                }
                state.push(account);
            },
            prepare: (
                deviceState: string,
                discoveryItem: DiscoveryItem,
                accountInfo: AccountInfo,
            ) => ({
                payload: {
                    deviceState,
                    index: discoveryItem.index,
                    path: discoveryItem.path,
                    descriptor: accountInfo.descriptor,
                    key: getAccountKey(accountInfo.descriptor, discoveryItem.coin, deviceState),
                    accountType: discoveryItem.accountType,
                    symbol: discoveryItem.coin,
                    empty: accountInfo.empty,
                    backendType: discoveryItem.backendType,
                    lastKnownState: discoveryItem.lastKnownState,
                    visible:
                        !accountInfo.empty ||
                        discoveryItem.accountType === 'coinjoin' ||
                        (discoveryItem.accountType === 'normal' && discoveryItem.index === 0),
                    balance: accountInfo.balance,
                    availableBalance: accountInfo.availableBalance,
                    formattedBalance: formatNetworkAmount(
                        // xrp `availableBalance` is reduced by reserve, use regular balance
                        discoveryItem.networkType === 'ripple'
                            ? accountInfo.balance
                            : accountInfo.availableBalance,
                        discoveryItem.coin,
                    ),
                    tokens: enhanceTokens(accountInfo.tokens),
                    addresses: enhanceAddresses(
                        accountInfo.addresses,
                        discoveryItem.networkType,
                        discoveryItem.index,
                    ),
                    utxo: enhanceUtxo(
                        accountInfo.utxo,
                        discoveryItem.networkType,
                        discoveryItem.index,
                    ),
                    history: accountInfo.history,
                    metadata: {
                        key: accountInfo.legacyXpub || accountInfo.descriptor,
                        fileName: '',
                        aesKey: '',
                        outputLabels: {},
                        addressLabels: {},
                    },
                    ...getAccountSpecific(accountInfo, discoveryItem.networkType),
                },
            }),
        },
        update: {
            reducer: (state, action: PayloadAction<Account>) => {
                update(state, action.payload);
            },
            prepare: (account: Account, accountInfo: AccountInfo | null = null) => {
                if (accountInfo) {
                    return {
                        payload: {
                            ...account,
                            ...accountInfo,
                            path: account.path,
                            empty: accountInfo.empty,
                            visible: account.visible || !accountInfo.empty,
                            formattedBalance: formatNetworkAmount(
                                // xrp `availableBalance` is reduced by reserve, use regular balance
                                account.networkType === 'ripple'
                                    ? accountInfo.balance
                                    : accountInfo.availableBalance,
                                account.symbol,
                            ),
                            utxo: enhanceUtxo(accountInfo.utxo, account.networkType, account.index),
                            addresses: enhanceAddresses(
                                accountInfo.addresses,
                                account.networkType,
                                account.index,
                            ),
                            tokens: enhanceTokens(accountInfo.tokens),
                            ...getAccountSpecific(accountInfo, account.networkType),
                        },
                    };
                }
                return {
                    payload: {
                        ...account,
                    },
                };
            },
        },
        changeVisibility: {
            reducer: (state, action: PayloadAction<Account>) => {
                update(state, action.payload);
            },
            prepare: (account: Account, visible = true) => ({
                payload: {
                    ...account,
                    visible,
                },
            }),
        },
    },
});

export const { create, update } = accountsSlice.actions;
export const accountsReducer = accountsSlice.reducer;
