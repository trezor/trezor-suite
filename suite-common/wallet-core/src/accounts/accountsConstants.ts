import { type AccountType, type NetworkType } from '@suite-common/wallet-config';

export const ACCOUNTS_MODULE_PREFIX = '@common/wallet-core/accounts';

const bitcoinFormattedAccountTypeMap: Record<AccountType, string | null> = {
    normal: null,
    taproot: 'Taproot',
    segwit: 'Legacy SegWit',
    legacy: 'Legacy',
    coinjoin: null,
    ledger: null,
    imported: null,
    placeholder: null,
};

const formattedAccountTypeMap: Record<AccountType, string | null> = {
    normal: null,
    legacy: 'Legacy',
    ledger: 'Ledger',
    coinjoin: null,
    segwit: null,
    taproot: null,
    imported: null,
    placeholder: null,
};

const formattedAccountTypeWithDefaultMap: Record<AccountType, string | null> = {
    ...formattedAccountTypeMap,
    normal: 'Default',
};

const bitcoinFormattedAccountTypeWithDefaultMap: Record<AccountType, string | null> = {
    ...bitcoinFormattedAccountTypeMap,
    normal: 'SegWit',
};

export const getFormattedAccountType = (networkType: NetworkType, accountType: AccountType) =>
    (networkType === 'bitcoin' ? bitcoinFormattedAccountTypeMap : formattedAccountTypeMap)[
        accountType
    ];

export const getFormattedAccountTypeWithDefault = (
    networkType: NetworkType,
    accountType: AccountType,
) =>
    (networkType === 'bitcoin'
        ? bitcoinFormattedAccountTypeWithDefaultMap
        : formattedAccountTypeWithDefaultMap)[accountType];
