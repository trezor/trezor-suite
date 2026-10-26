import { defineFamily } from '@trezor/network-module-suite-common-types';
import { supportedSolanaNetworks } from '@trezor/network-solana-types';

import { getNetworkConfig } from './networkConfig';

/** No capability yet: the family exists so every Solana symbol resolves to a network. */
export const solanaFamily = defineFamily<Record<never, never>>()({
    family: 'solana',
    symbols: supportedSolanaNetworks,
    getConfig: getNetworkConfig,
    capabilities: {},
});
