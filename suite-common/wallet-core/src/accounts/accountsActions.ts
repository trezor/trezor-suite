import { createAction } from '@reduxjs/toolkit';

import { AccountInfo } from '@trezor/connect';
import { Account, AccountState, DiscoveryItem } from '@suite-common/wallet-types';
import {
    enhanceAddresses,
    enhanceTokens,
    enhanceUtxo,
    formatNetworkAmount,
    getAccountKey,
    getAccountSpecific,
} from '@suite-common/wallet-utils';

import { actionPrefix } from './constants';

const disposeAccount = createAction(`${actionPrefix}/disposeAccount`);

const updateSelectedAccount = createAction(
    `${actionPrefix}/updateSelectedAccount`,
    (payload: AccountState): { payload: AccountState } => ({
        payload,
    }),
);

const removeAccount = createAction(
    `${actionPrefix}/removeAccount`,
    (payload: Account[]): { payload: Account[] } => ({
        payload,
    }),
);

const createAccount = createAction(
    `${actionPrefix}/createAccount`,
    (
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
            utxo: enhanceUtxo(accountInfo.utxo, discoveryItem.networkType, discoveryItem.index),
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
);

const updateAccount = createAction(
    `${actionPrefix}/updateAccount`,
    (account: Account, accountInfo: AccountInfo | null = null): { payload: Account } => {
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
);

const changeAccountVisibility = createAction(
    `${actionPrefix}/changeAccountVisibility`,
    (account: Account, visible = true): { payload: Account } => ({
        payload: {
            ...account,
            visible,
        },
    }),
);

export const accountsActions = {
    disposeAccount,
    removeAccount,
    createAccount,
    updateAccount,
    updateSelectedAccount,
    changeAccountVisibility,
} as const;

export type AccountsAction = ReturnType<typeof accountsActions[keyof typeof accountsActions]>;
