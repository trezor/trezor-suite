import type { AccountInfo, Transaction } from '@trezor/blockchain-link-types';

export interface RippleMisc {
    sequence: number;
    reserve: string;
    marker?: { ledger: number; seq: number };
}

export type RippleTransaction = Transaction<{ destinationTag?: number }>;
export type RippleAccountInfo = AccountInfo<RippleMisc>;
