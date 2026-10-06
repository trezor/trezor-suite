import type { SuiteCommonNetworkConfig } from '@trezor/network-module-suite-common-types';

import type { NetworkSymbol } from '../src/NetworkModules';

// Keep serializable configuration in Redux; module implementations and services remain in DI.
export type NetworkMetadata = SuiteCommonNetworkConfig & { readonly symbol: NetworkSymbol };
