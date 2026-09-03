import { BigNumber } from '@trezor/utils';

export const CARDANO_EPOCH_DAYS = 5;
const CARDANO_APPROXIMATE_EPOCHS = 2;
export const CARDANO_ACTIVATION_PERIOD_DAYS = CARDANO_APPROXIMATE_EPOCHS * CARDANO_EPOCH_DAYS;

export const MIN_CARDANO_AMOUNT_FOR_STAKING = new BigNumber(0);
export const MAX_CARDANO_AMOUNT_FOR_STAKING = new BigNumber(72_000_000);
export const MIN_CARDANO_FOR_WITHDRAWALS = new BigNumber(0);

export const MIN_CARDANO_BALANCE_FOR_FEE_BUFFER = new BigNumber(0);
export const MIN_CARDANO_BALANCE_FOR_STAKING = MIN_CARDANO_AMOUNT_FOR_STAKING.plus(
    MIN_CARDANO_FOR_WITHDRAWALS,
);

export const CARDANO_EVERSTAKE_STAKING_POOL = {
    hex: '88d719a2d9b57e7f68a77e70b3e8b8e17c76c74dc12ea52e159bb89f',
    bech32: 'pool13rt3ngkek4l876980ect869cu978d36dcyh22ts4nwuf7ncq02u',
};

export const CARDANO_EVERSTAKE_DREP = {
    hex: 'ce179dfd95a1a136666945aee81a784b0d96541ffcbc6a3b4cfa71eb',
    bech32: 'drep1yt8p080ajks6zdnxd9z6a6q60p9sm9j5rl7tc63mfna8r6cnp4wr3',
};
