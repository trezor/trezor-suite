import type { NetworkSymbol } from '@trezor/network-module-types';

import type { AccountType, BackendType } from '../SuiteCommonNetworkConfig';

/**
 * Everything besides the static config that decides how a network behaves: the backend serving
 * it, the account type it is used for and, where a family cares, the protocol version.
 *
 * The same symbol resolves to different networks under different contexts, so this, not the
 * symbol alone, is what a network is resolved by.
 */
export type NetworkContext<TSymbol extends string = NetworkSymbol> = {
    readonly symbol: TSymbol;
    readonly backend: BackendType;
    /** Absent when the network is resolved for something other than one account. */
    readonly accountType?: AccountType;
    readonly version?: string;
};
