// Stellar types from stellar-sdk
// https://github.com/stellar/js-stellar-base

import type { Static } from '@trezor/schema-utils';
import { Type } from '@trezor/schema-utils';

import type { stellarGetAddress } from './stellarGetAddress';
import type { stellarSignTransaction } from './stellarSignTransaction';

// Stellar-specific operations
export const TrezorConnectStellar = Type.Object({
    stellarGetAddress: Type.Unsafe<typeof stellarGetAddress>(),
    stellarSignTransaction: Type.Unsafe<typeof stellarSignTransaction>(),
});
export type TrezorConnectStellar = Static<typeof TrezorConnectStellar>;
