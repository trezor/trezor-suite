import {
    type NetworkConfiguration,
    type NetworkConfigurationImplementation,
    type NetworkSendModule,
    createSuitePlatformNetworkModule,
} from '@trezor/network-module-suite-common-types';

import type { NativeNetworkComponents } from './NativeSendComponents';

export type NativeNetworkSendModule = NetworkSendModule<NativeNetworkComponents>;

/**
 * Checks a native implementation against the network's declaration and returns the send module
 * the generic native send form consumes. Supported symbols stay on `SuiteNativeNetworkModule`.
 */
export const createNativeNetworkSendModule = <TConfiguration extends NetworkConfiguration>(
    configuration: TConfiguration,
    implementation: NetworkConfigurationImplementation<TConfiguration, NativeNetworkComponents>,
): NativeNetworkSendModule =>
    createSuitePlatformNetworkModule<TConfiguration, NativeNetworkComponents>(
        configuration,
        implementation,
    ).getSend();
