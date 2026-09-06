import type { trezorUtils } from '@trezor/network-cardano-coin-selection';

export type { types } from '@trezor/network-cardano-coin-selection';

export type CardanoAddressParameters = Parameters<
    (typeof trezorUtils)['transformToTrezorOutputs']
>[1];
