import { AccountType } from '@suite-common/wallet-types';

export const actionPrefix = '@common/wallet-core/accounts';

export const formattedAccountTypeMap: Partial<Record<AccountType, string>> = {
    legacy: 'Taproot',
    legacySegwit: 'Legacy SegWit',
    segwit: 'SegWit',
    taproot: 'Legacy',
    normal: 'SegWit Native',
};
