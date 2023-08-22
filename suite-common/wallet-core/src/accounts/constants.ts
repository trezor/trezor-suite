import { AccountType } from '@suite-common/wallet-types';

export const accountActionsPrefix = '@common/wallet-core/accounts';

export const formattedAccountTypeMap: Partial<Record<AccountType, string>> = {
    legacy: 'Legacy',
    legacySegwit: 'Legacy SegWit',
    segwit: 'SegWit',
    taproot: 'Taproot',
};
