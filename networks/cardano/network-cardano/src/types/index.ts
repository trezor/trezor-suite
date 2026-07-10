import type { trezorUtils } from '@fivebinaries/coin-selection';

export type { types } from '@fivebinaries/coin-selection';

export type CardanoAddressParameters = Parameters<
    (typeof trezorUtils)['transformToTrezorOutputs']
>[1];
