import { AccountType } from '@suite-common/wallet-types';

export const accountsActionsPrefix = '@common/wallet-core/accounts';

export const formattedAccountTypeMap: Partial<Record<AccountType, string>> = {
    normal: 'SegWit', // represents the default Suite account type (`SegWit Native` at the moment).
    taproot: 'Taproot',
    segwit: 'Legacy SegWit',
    legacy: 'Legacy',
};
