import { BigNumber } from '@trezor/utils';

export const MIN_CARDANO_AMOUNT_FOR_SEND = new BigNumber(1_000_000);

// Protocol deposit locked when a stake key is registered, refunded on deregistration. Kept here
// rather than with the staking constants in wallet-core so packages that only need the value
// (e.g. e2e assertions) do not have to depend on the wallet core.
export const CARDANO_STAKING_REGISTRATION_DEPOSIT = '2';

export const CARDANO_EVERSTAKE_STAKING_POOL = {
    hex: '88d719a2d9b57e7f68a77e70b3e8b8e17c76c74dc12ea52e159bb89f',
    bech32: 'pool13rt3ngkek4l876980ect869cu978d36dcyh22ts4nwuf7ncq02u',
};

export const CARDANO_EVERSTAKE_DREP = {
    hex: 'ce179dfd95a1a136666945aee81a784b0d96541ffcbc6a3b4cfa71eb',
    bech32: 'drep1yt8p080ajks6zdnxd9z6a6q60p9sm9j5rl7tc63mfna8r6cnp4wr3',
};
