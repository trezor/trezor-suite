import { BigNumber } from '@trezor/utils';

export const MIN_CARDANO_AMOUNT_FOR_SEND = new BigNumber(1_000_000);

export const CARDANO_EPOCH_DAYS = 5;
// Delegation activates two epoch boundaries after the certificate.
export const CARDANO_ACTIVATION_PERIOD_MIN_DAYS = CARDANO_EPOCH_DAYS;
export const CARDANO_ACTIVATION_PERIOD_MAX_DAYS = 2 * CARDANO_EPOCH_DAYS;

// Protocol deposit locked when a stake key is registered, refunded on deregistration. Kept here
// rather than with the staking constants in wallet-core so packages that only need the value
// (e.g. e2e assertions) do not have to depend on the wallet core.
export const CARDANO_STAKING_REGISTRATION_DEPOSIT = '2';

export const CARDANO_EVERSTAKE_STAKING_POOL = {
    hex: '327f9bb05d6d5c3d0c6c4eb39eea9282e9d4bc75b3c77a999b9810cb',
    bech32: 'pool1xflehvzad4wr6rrvf6eea65jst5af0r4k0rh4xvmnqgvkzt3xjt',
};

export const CARDANO_EVERSTAKE_DREP = {
    hex: 'ce179dfd95a1a136666945aee81a784b0d96541ffcbc6a3b4cfa71eb',
    bech32: 'drep1yt8p080ajks6zdnxd9z6a6q60p9sm9j5rl7tc63mfna8r6cnp4wr3',
};
