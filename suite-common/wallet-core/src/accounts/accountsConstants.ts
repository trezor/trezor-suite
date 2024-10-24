import { AccountType, NetworkType } from '@suite-common/wallet-config';

export const ACCOUNTS_MODULE_PREFIX = '@common/wallet-core/accounts';

export const formattedAccountTypeMap: Partial<
    Record<NetworkType, Partial<Record<AccountType, string>>>
> = {
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
};
