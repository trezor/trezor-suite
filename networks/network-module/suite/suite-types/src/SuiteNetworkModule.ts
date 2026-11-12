import type { Account } from '@suite-common/wallet-types';
import type { NetworkSymbol } from '@trezor/network-module-types';

import type { SignVerifyFeature } from './SignVerifyFeature';

/**
 * Desktop and web features of a network family.
 *
 * Each feature is resolved for its context and is `null` when the network does not offer it there.
 */
export type SuiteNetworkModule = {
    getSupportedNetworks: () => readonly NetworkSymbol[];
    getSignVerify: (account: Account) => SignVerifyFeature | null;
};
