import { BigNumber } from '@trezor/utils';

export const MIN_TRON_AMOUNT_FOR_STAKING = new BigNumber(1);
export const MAX_TRON_AMOUNT_FOR_STAKING = new BigNumber(1_000_000_000);
export const MIN_TRON_FOR_WITHDRAWALS = new BigNumber(0.01);
export const MIN_TRON_BALANCE_FOR_FEE_BUFFER = new BigNumber(5);
export const MIN_TRON_BALANCE_FOR_STAKING =
    MIN_TRON_AMOUNT_FOR_STAKING.plus(MIN_TRON_FOR_WITHDRAWALS);
