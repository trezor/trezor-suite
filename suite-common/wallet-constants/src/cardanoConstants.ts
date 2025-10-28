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

export const CARDANO_EVERSTAKE_DREP = {
    hex: 'ce179dfd95a1a136666945aee81a784b0d96541ffcbc6a3b4cfa71eb',
    bech32: 'drep1yt8p080ajks6zdnxd9z6a6q60p9sm9j5rl7tc63mfna8r6cnp4wr3',
};

export const MIN_CARDANO_AMOUNT_FOR_SEND = new BigNumber(1_000_000);
