import { NetworkType } from '@suite-common/wallet-config';
import { AccountType } from '@suite-common/wallet-types';

export const accountsActionsPrefix = '@common/wallet-core/accounts';

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
};
