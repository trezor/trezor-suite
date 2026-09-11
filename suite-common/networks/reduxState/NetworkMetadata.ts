import type { Explorer, NetworkType } from '@suite-common/legacy-network-config';
import type { SuiteCommonNetworkConfig } from '@trezor/network-module-suite-common-types';

import type { NetworkSymbol } from '../src/NetworkModules';

/**
 * Redux holds UI state, not general application state. Keep only serializable network metadata
 * needed by the UI here, such as colors, icon identifiers, and explorer links. Network module
 * implementations, services, and configuration unrelated to the UI stay outside this slice.
 */
export type NetworkMetadata = SuiteCommonNetworkConfig & {
    readonly symbol: NetworkSymbol;
    readonly name: string;
    readonly displaySymbol: string;
    readonly networkType: NetworkType;
    readonly decimals: number;
    readonly testnet: boolean;
    readonly explorer: Explorer;
};
