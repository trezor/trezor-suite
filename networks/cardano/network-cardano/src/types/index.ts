import type { trezorUtils } from '@trezor/network-cardano-coin-selection/runtime';

export type * as types from '@trezor/network-cardano-coin-selection/types';

export type CardanoAddressParameters = Parameters<
    (typeof trezorUtils)['transformToTrezorOutputs']
>[1];
