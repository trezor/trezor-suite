import type { CoinSymbol } from '@trezor/connect-common';
import type { NetworkSymbol } from '@trezor/network-module-types';

/**
 * Connect names coins by the network symbol. Same as `asCoinSymbol` from `@trezor/connect-common`,
 * which is not imported at runtime: it would pull Connect's protobuf into every network module.
 */
export const toCoinSymbol = (symbol: NetworkSymbol): CoinSymbol => symbol as CoinSymbol;
