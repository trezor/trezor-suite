import { BigNumber } from '@trezor/utils/src/bigNumber';

export const MIN_ETH_AMOUNT_FOR_STAKING = new BigNumber(0.1);
export const MAX_ETH_AMOUNT_FOR_STAKING = new BigNumber(1_000_000);
export const MIN_ETH_FOR_WITHDRAWALS = new BigNumber(0.03);
export const MIN_ETH_BALANCE_FOR_STAKING = MIN_ETH_AMOUNT_FOR_STAKING.plus(MIN_ETH_FOR_WITHDRAWALS);

export const BACKUP_REWARD_PAYOUT_DAYS = 7;
