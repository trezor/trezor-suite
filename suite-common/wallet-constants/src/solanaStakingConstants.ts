import { BigNumber } from '@trezor/utils';

export const BACKUP_SOL_APY = 6.87;
export const MIN_SOL_AMOUNT_FOR_STAKING = new BigNumber(0.01);
export const MAX_SOL_AMOUNT_FOR_STAKING = new BigNumber(10_000_000);
export const MIN_SOL_FOR_WITHDRAWALS = new BigNumber(0.000005);
export const MIN_SOL_BALANCE_FOR_STAKING = MIN_SOL_AMOUNT_FOR_STAKING.plus(MIN_SOL_FOR_WITHDRAWALS);
export const SOL_STAKING_OPERATION_FEE = new BigNumber(70_000); // 0.00007 SOL

export const SOLANA_EPOCH_DAYS = 3;
