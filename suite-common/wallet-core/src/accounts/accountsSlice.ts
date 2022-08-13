import { createAction, PayloadAction } from '@reduxjs/toolkit';

import { AccountInfo } from '@trezor/connect';
import {
    createSliceWithExtraDependencies,
    matchesActionType,
    matchesAnyOfActionType,
} from '@suite-common/redux-utils';
import { Account, DiscoveryItem } from '@suite-common/wallet-types';
import {
    enhanceAddresses,
    enhanceTokens,
    enhanceUtxo,
    formatNetworkAmount,
    getAccountKey,
    getAccountSpecific,
} from '@suite-common/wallet-utils';

import { modulePrefix } from './constants';

export type AccountsSliceState = Account[];

const initialState = [] as AccountsSliceState;

type AccountsSliceRootState = {
    wallet: {
        accounts: AccountsSliceState;
    };
};

const accountEqualTo = (b: Account) => (a: Account) =>
    a.deviceState === b.deviceState && a.descriptor === b.descriptor && a.symbol === b.symbol;

const update = (state: AccountsSliceState, account: Account) => {
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

const remove = (state: AccountsSliceState, accounts: Account[]) => {
    accounts.forEach(a => {
        const index = state.findIndex(accountEqualTo(a));
        state.splice(index, 1);
    });
};

const setMetadata = (state: AccountsSliceState, account: Account) => {
    const index = state.findIndex(a => a.key === account.key);
    if (!state[index]) return;
    state[index].metadata = account.metadata;
};

export const disposeAccount = createAction(`${modulePrefix}/dispose`);

export const accountsSlice = createSliceWithExtraDependencies({
    name: modulePrefix,
    initialState,
    reducers: {
        removeAccount: (state, action: PayloadAction<Account[]>) => {
            remove(state, action.payload);
        },
        createAccount: {
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
            ): { payload: Account } => ({
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
        updateAccount: {
            reducer: (state, action: PayloadAction<Account>) => {
                update(state, action.payload);
            },
            prepare: (
                account: Account,
                accountInfo: AccountInfo | null = null,
            ): { payload: Account } => {
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
                    payload: account,
                };
            },
        },
        changeAccountVisibility: {
            reducer: (state, action: PayloadAction<Account>) => {
                update(state, action.payload);
            },
            prepare: (account: Account, visible = true): { payload: Account } => ({
                payload: {
                    ...account,
                    visible,
                },
            }),
        },
    },
    extraReducers: (builder, extra) => {
        builder
            .addMatcher(
                matchesActionType(extra.actionTypes.storageLoad),
                extra.reducers.storageLoadAccounts,
            )
            .addMatcher(
                matchesAnyOfActionType(
                    extra.actionTypes.metadataAccountLoaded,
                    extra.actionTypes.metadataAccountAdd,
                ),
                (state: AccountsSliceState, { payload }) => setMetadata(state, payload),
            );
    },
});

export const accountActions = { ...accountsSlice.actions, disposeAccount };
export const prepareAccountsReducer = accountsSlice.prepareReducer;

export const selectAccounts = (state: AccountsSliceRootState) => state.wallet.accounts;
