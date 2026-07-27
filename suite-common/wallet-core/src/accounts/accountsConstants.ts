import { type AccountType, type NetworkType } from '@suite-common/wallet-config';

export const ACCOUNTS_MODULE_PREFIX = '@common/wallet-core/accounts';

type AccountTypeMap = Partial<Record<NetworkType, Partial<Record<AccountType, string>>>>;

export const formattedAccountTypeMap: AccountTypeMap = {
    bitcoin: {
        normal: 'SegWit',
        taproot: 'Taproot',
        segwit: 'Legacy SegWit',
        legacy: 'Legacy',
    },
    cardano: {
        legacy: 'Legacy',
        ledger: 'Ledger',
    },
    ethereum: {
        legacy: 'Legacy',
        ledger: 'Ledger',
    },
    solana: {
        ledger: 'Ledger',
    },
};

export const formattedAccountTypeWithDefaultMap: AccountTypeMap = {
    bitcoin: {
        normal: 'SegWit',
        taproot: 'Taproot',
        segwit: 'Legacy SegWit',
        legacy: 'Legacy',
    },
    cardano: {
        normal: 'Default',
        legacy: 'Legacy',
        ledger: 'Ledger',
    },
    ethereum: {
        normal: 'Default',
        legacy: 'Legacy',
        ledger: 'Ledger',
    },
    solana: {
        normal: 'Default',
        ledger: 'Ledger',
    },
    ripple: {
        normal: 'Default',
    },
    stellar: {
        normal: 'Default',
    },
    tron: {
        normal: 'Default',
    },
};
