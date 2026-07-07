import { type FeeInfo } from '@suite-common/wallet-types';

export const FEES_UPDATE_INTERVAL_MILLISECONDS = 60_000; // interval to refetch estimated fees from backend
export const FEE_UPDATE_DELAY_MILLISECONDS = 1_000; // artificial delay before updating fees after user input

export const EVM_FEE_RATE_DECIMALS = 4;

export const DEFAULT_FEE_INFO: FeeInfo = {
    blockHeight: 0,
    blockTime: 10,
    minFee: 1,
    maxFee: 100,
    minPriorityFee: 0,
    levels: [{ label: 'normal', feePerUnit: '1', blocks: 0 }],
};
