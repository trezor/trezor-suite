import { BigNumber } from '@trezor/utils';

export const BACKUP_CARDANO_APY = 4.5;
export const ESTIMATED_YEARLY_REWARD_RATE = 2.22;
export const CARDANO_ACTIVATION_PERIOD_DAYS = 10;
export const CARDANO_EPOCH_DAYS = 5;

export const CARDANO_STAKING_REGISTRATION_DEPOSIT = '2';
export const MIN_CARDANO_AMOUNT_FOR_STAKING = new BigNumber(2);
export const MAX_CARDANO_AMOUNT_FOR_STAKING = new BigNumber(72_000_000);
export const MIN_CARDANO_FOR_WITHDRAWALS = new BigNumber(2);
export const MIN_CARDANO_BALANCE_FOR_STAKING = MIN_CARDANO_AMOUNT_FOR_STAKING.plus(
    MIN_CARDANO_FOR_WITHDRAWALS,
);
