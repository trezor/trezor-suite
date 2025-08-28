import { createAction } from '@reduxjs/toolkit';

import { getNetwork, networks } from '@suite-common/wallet-config';
import { Account, SelectedAccountStatus } from '@suite-common/wallet-types';
import {
    enhanceAddresses,
    enhanceTokens,
    enhanceUtxo,
    formatNetworkAmount,
    getAccountKey,
    getAccountSpecific,
} from '@suite-common/wallet-utils';
import { AccountInfo, StaticSessionId } from '@trezor/connect';
import { isArrayMember } from '@trezor/utils';

import { ACCOUNTS_MODULE_PREFIX } from './accountsConstants';

const disposeAccount = createAction(`${ACCOUNTS_MODULE_PREFIX}/disposeAccount`);

const updateSelectedAccount = createAction(
    `${ACCOUNTS_MODULE_PREFIX}/updateSelectedAccount`,
    (payload: SelectedAccountStatus): { payload: SelectedAccountStatus } => ({
        payload,
    }),
);

const removeAccount = createAction(
    `${ACCOUNTS_MODULE_PREFIX}/removeAccount`,
    (payload: Account[]): { payload: Account[] } => ({
        payload,
    }),
);

export type CreateAccountActionProps = Pick<
    Account,
    | 'path'
    | 'unlockPath'
    | 'symbol'
    | 'index'
    | 'accountType'
    | 'backendType'
    | 'deviceState'
    | 'imported'
    | 'accountLabel'
    | 'visible'
> & {
    accountInfo: AccountInfo;
    error?: string;
};

const createAccount = createAction(
    `${ACCOUNTS_MODULE_PREFIX}/createAccount`,
    ({
        deviceState,
        path,
        unlockPath,
        symbol,
        index,
        accountType,
        backendType,
        accountInfo,
        imported,
        accountLabel,
        visible,
        error,
    }: CreateAccountActionProps): { payload: Account } => {
        try {
            const { chainId } = getNetwork(symbol);
            const { networkType } = networks[symbol];
            const isNonEthEvm = networkType === 'ethereum' && symbol !== 'eth';

            const metadataKey = isNonEthEvm
                ? `${accountInfo.descriptor}-${chainId}`
                : accountInfo.legacyXpub || accountInfo.descriptor;

            const payload: Account = {
                deviceState,
                accountLabel,
                imported,
                ...(error !== undefined ? { error, failed: true } : { failed: undefined }),
                index,
                path,
                unlockPath,
                descriptor: accountInfo.descriptor,
                descriptorChecksum: accountInfo.descriptorChecksum,
                key: getAccountKey(accountInfo.descriptor, symbol, deviceState),
                accountType,
                symbol,
                empty: accountInfo.empty,
                ...(backendType === 'coinjoin'
                    ? {
                          backendType: 'coinjoin',
                          status: 'initial',
                      }
                    : {
                          backendType,
                      }),
                visible,
                balance: accountInfo.balance,
                availableBalance: accountInfo.availableBalance,
                formattedBalance: formatNetworkAmount(
                    // Ripple and Stellar `availableBalance` is reduced by reserve, use regular balance
                    isArrayMember(networkType, ['ripple', 'stellar'])
                        ? accountInfo.balance
                        : accountInfo.availableBalance,
                    symbol,
                ),
                tokens: enhanceTokens(accountInfo.tokens),
                addresses: enhanceAddresses(accountInfo, {
                    networkType,
                    index,
                    addresses: accountInfo.addresses,
                }),
                utxo: enhanceUtxo(accountInfo.utxo, networkType, index),
                history: accountInfo.history,
                metadata: {
                    key: metadataKey,
                },
                ts: Date.now(),
                ...getAccountSpecific(accountInfo, networkType),
            };

            return { payload };
        } catch (error) {
            console.error('Error creating account payload:', error);
            throw new Error('Failed to create account payload');
        }
    },
);

const createAccountFromAccountInfo = createAction(
    `${ACCOUNTS_MODULE_PREFIX}/createAccountFromAccountInfo`,
    (accountInfo: AccountInfo, deviceState: StaticSessionId): { payload: Account } => ({
        // @ts-expect-error, bit43path type,marek
        payload: {
            ...accountInfo,
            deviceState,
            accountLabel: 'label',
            imported: false,
            index: 0,
        },
    }),
);

const updateAccount = createAction(
    `${ACCOUNTS_MODULE_PREFIX}/updateAccount`,
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
                        // Ripple and Stellar `availableBalance` is reduced by reserve, use regular balance
                        account.networkType === 'ripple' || account.networkType === 'stellar'
                            ? accountInfo.balance
                            : accountInfo.availableBalance,
                        account.symbol,
                    ),
                    utxo: enhanceUtxo(accountInfo.utxo, account.networkType, account.index),
                    addresses: enhanceAddresses(accountInfo, account),
                    tokens: enhanceTokens(accountInfo.tokens),
                    ts: Date.now(),
                    ...getAccountSpecific(accountInfo, account.networkType),
                },
            };
        }

        return {
            payload: { ...account, ts: Date.now() },
        };
    },
);

const updateAccountRefreshTimestamp = createAction(
    `${ACCOUNTS_MODULE_PREFIX}/updateAccountRefreshTimestamp`,
    (account: Account): { payload: Account } => ({
        payload: { ...account, ts: Date.now() },
    }),
);

const renameAccount = createAction(
    `${ACCOUNTS_MODULE_PREFIX}/renameAccount`,
    (accountKey: string, accountLabel: string) => ({
        payload: {
            accountKey,
            accountLabel,
        },
    }),
);

const startCoinjoinAccountSync = createAction(
    `${ACCOUNTS_MODULE_PREFIX}/startCoinjoinAccountSync`,
    (account: Extract<Account, { backendType: 'coinjoin' }>) => ({
        payload: {
            accountKey: account.key,
        },
    }),
);

const endCoinjoinAccountSync = createAction(
    `${ACCOUNTS_MODULE_PREFIX}/endCoinjoinAccountSync`,
    (
        account: Extract<Account, { backendType: 'coinjoin' }>,
        status: Extract<Account, { backendType: 'coinjoin' }>['status'],
    ) => ({
        payload: {
            accountKey: account.key,
            status,
        },
    }),
);

const changeAccountVisibility = createAction(
    `${ACCOUNTS_MODULE_PREFIX}/changeAccountVisibility`,
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
    createAccountFromAccountInfo,
    updateAccount,
    updateAccountRefreshTimestamp,
    renameAccount,
    updateSelectedAccount,
    changeAccountVisibility,
    startCoinjoinAccountSync,
    endCoinjoinAccountSync,
} as const;
