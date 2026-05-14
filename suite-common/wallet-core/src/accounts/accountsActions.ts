import { createAction } from '@reduxjs/toolkit';

import { getNetwork } from '@suite-common/wallet-config';
import {
    type Account,
    type AccountBackendSpecific,
    type AccountFailureSpecific,
    type SelectedAccountStatus,
    asAccountDescriptor,
    createAccountKey,
} from '@suite-common/wallet-types';
import {
    enhanceAddresses,
    enhanceTokens,
    enhanceUtxo,
    formatNetworkAmount,
    getAccountSpecific,
} from '@suite-common/wallet-utils';
import { type AccountInfo, type StaticSessionId } from '@trezor/connect';
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
    | 'deviceState'
    | 'imported'
    | 'accountLabel'
    | 'visible'
> & {
    accountInfo: AccountInfo;
} & AccountBackendSpecific &
    AccountFailureSpecific;

const createAccount = createAction(
    `${ACCOUNTS_MODULE_PREFIX}/createAccount`,
    ({ accountInfo, ...account }: CreateAccountActionProps): { payload: Account } => {
        const { symbol, index, deviceState } = account;
        const { descriptor, descriptorChecksum, legacyXpub } = accountInfo;
        const { empty, balance, availableBalance, addresses, history, utxo, tokens } = accountInfo;

        try {
            const { chainId, networkType } = getNetwork(symbol);

            const isNonEthEvm = networkType === 'ethereum' && symbol !== 'eth';
            const metadataKey = isNonEthEvm ? `${descriptor}-${chainId}` : legacyXpub || descriptor;

            const payload: Account = {
                ...account,
                descriptor: asAccountDescriptor(descriptor),
                descriptorChecksum,
                empty,
                balance,
                availableBalance,
                history,
                key: createAccountKey({
                    accountDescriptor: asAccountDescriptor(descriptor),
                    networkSymbol: symbol,
                    deviceStaticSessionId: deviceState,
                }),
                formattedBalance: formatNetworkAmount(
                    // Ripple and Stellar `availableBalance` is reduced by reserve, use regular balance
                    isArrayMember(networkType, ['ripple', 'stellar']) ? balance : availableBalance,
                    symbol,
                ),
                tokens: enhanceTokens(tokens),
                addresses: enhanceAddresses(accountInfo, {
                    networkType,
                    index,
                    addresses,
                }),
                utxo: enhanceUtxo(utxo, networkType, index),
                metadata: { key: metadataKey },
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
                    descriptor: asAccountDescriptor(accountInfo.descriptor),
                    path: account.path,
                    empty: accountInfo.empty,
                    visible: account.visible || !accountInfo.empty,
                    formattedBalance: formatNetworkAmount(
                        // Ripple and Stellar `availableBalance` is reduced by reserve, use regular balance
                        ['ripple', 'stellar'].includes(account.networkType)
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
