import { AccountType } from '@suite-common/wallet-types';

export const actionPrefix = '@common/wallet-core/accounts';

export const formattedAccountTypeMap: Partial<Record<AccountType, string>> = {
    legacy: 'Legacy',
    legacySegwit: 'Legacy SegWit',
    segwit: 'SegWit',
    taproot: 'Taproot',
    normal: 'SegWit Native',
};
