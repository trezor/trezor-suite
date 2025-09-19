import { BigNumber } from '@trezor/utils';

export const BACKUP_CARDANO_APY = 4.5;
export const ESTIMATED_YEARLY_REWARD_RATE = 2.22;
export const CARDANO_ACTIVATION_PERIOD_DAYS = 10;
export const CARDANO_EPOCH_DAYS = 5;

export const CARDANO_STAKING_REGISTRATION_DEPOSIT = '2';
export const MIN_CARDANO_AMOUNT_FOR_STAKING = new BigNumber(0);
export const MAX_CARDANO_AMOUNT_FOR_STAKING = new BigNumber(72_000_000);
export const MIN_CARDANO_FOR_WITHDRAWALS = new BigNumber(0);
export const MIN_CARDANO_BALANCE_FOR_STAKING = MIN_CARDANO_AMOUNT_FOR_STAKING.plus(
    MIN_CARDANO_FOR_WITHDRAWALS,
);

export const CARDANO_EVERSTAKE_STAKING_POOL = {
    hex: '8120831fd871a6023c2099d05f21b76bdbb1e4a37464c0cd56f743c7',
    bech32: 'pool1sysgx87cwxnqy0pqn8g97gdhd0dmre9rw3jvpn2k7apuwa7cgkn',
};
