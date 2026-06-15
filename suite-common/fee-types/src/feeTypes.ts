import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type FeeLevel } from '@trezor/connect';

export interface FeeInfo {
    blockHeight: number; // when fee info was updated; 0 = never
    blockTime: number; // how often block is mined
    minFee: number;
    maxFee: number;
    minPriorityFee: number; // eth minimum max priority fee
    dustLimit?: number; // coin dust limit
    feeLimit?: number; // eth gas limit
    levels: FeeLevel[]; // fee levels are predefined in @trezor/connect > trezor-firmware/common
}

export type FeesStatus = 'preloaded' | 'loading' | 'loaded' | 'error';

export type FeesState = {
    [key in NetworkSymbol]?: {
        status: FeesStatus;
        data?: FeeInfo;
    };
};
