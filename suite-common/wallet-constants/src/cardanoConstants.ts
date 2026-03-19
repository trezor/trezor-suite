import { BigNumber } from '@trezor/utils';

export const ESTIMATED_YEARLY_REWARD_RATE = 2.22;
export const CARDANO_EPOCH_DAYS = 5;
export const CARDANO_APPROXIMATE_EPOCHS = 2;
export const CARDANO_ACTIVATION_PERIOD_DAYS = CARDANO_APPROXIMATE_EPOCHS * CARDANO_EPOCH_DAYS;

export const CARDANO_STAKING_REGISTRATION_DEPOSIT = '2';
export const MIN_CARDANO_AMOUNT_FOR_STAKING = new BigNumber(0);
export const MAX_CARDANO_AMOUNT_FOR_STAKING = new BigNumber(72_000_000);
export const MIN_CARDANO_FOR_WITHDRAWALS = new BigNumber(0);
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

export const CARDANO_POOL_SATURATION_SAFE_THRESHOLD = 80; // in percentage

export const MIN_CARDANO_AMOUNT_FOR_SEND = new BigNumber(1_000_000);

export const FIVE_BINARIES_POOLS = [
    'pool1k2qhlrrweu8fecd4hx4hn22lv00nrd3rjdxj6durax7m78q7ynu',
    'pool1nhhsh9yhlrvj9e3nce0zpx0xm2xlt6tx7gqakhr6hjc8wy84sat',
    'pool1z5rt6kn6yvuczj44qla73mfyln9l55lw0jkz6x4kjw00u32zec3',
    'pool1398lzhvtaa0hgz305d2jz4urfkwkkt66yv476wqe6att2f7dphh',
    'pool1z9m2kxeat06t30yf6ar7sqpert0cjdgxzcv2dv36dcwcqcqtgk4',
];

export const EVERSTAKE_POOLS = [
    'pool1sysgx87cwxnqy0pqn8g97gdhd0dmre9rw3jvpn2k7apuwa7cgkn',
    'pool1n0uxgs5qfk5n9xl7qvq9jt8zuu02cntrsjnjayjlqtejyffnemj',
    'pool13rt3ngkek4l876980ect869cu978d36dcyh22ts4nwuf7ncq02u',
];
