import type { Account } from '@suite-common/wallet-types';
import { PAGING } from '@trezor/connect';

export const getTxsPerPage = (networkType: Account['networkType']) => {
    switch (networkType) {
        case 'cardano':
            return PAGING.CARDANO_TXS_PER_PAGE;
        case 'solana':
            return PAGING.SOLANA_TXS_PER_PAGE;
        default:
            return PAGING.DEFAULT_TXS_PER_PAGE;
    }
};
