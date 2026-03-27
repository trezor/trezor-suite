import type { AccountInfo, Transaction } from '@trezor/blockchain-link-types';

export interface StellarMisc {
    stellarSequence: string;
    reserve: string;
    stellarCursor?: string;
}

export type StellarTransaction = Transaction<{
    memo?: string;
    feeSource: string;
    operationType?: 'changeTrust';
    changeTrust?: { assetCode: string; isRemoval: boolean };
}>;

export type StellarAccountInfo = AccountInfo<StellarMisc>;

export type TokenDetailByMint = {
    [mint: string]: { name: string; symbol: string; home_domain?: string; rating?: number };
};
