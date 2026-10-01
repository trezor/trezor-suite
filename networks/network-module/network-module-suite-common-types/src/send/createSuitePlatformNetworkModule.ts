import { asNetworkSymbols } from '@trezor/network-module-types';

import type { NetworkComponentMap } from './NetworkComponentMap';
import type { NetworkConfiguration } from './NetworkConfiguration';
import type { NetworkConfigurationImplementation } from './NetworkConfigurationImplementation';
import type {
    NetworkSendModule,
    SendFieldContribution,
    SuitePlatformNetworkModule,
} from './SuitePlatformNetworkModule';

/**
 * Pairs a network's configuration with the components one platform supplies for it. The
 * configuration is the network's interface, the implementation is checked against it at the call
 * site, and the result hides both behind the platform module contract.
 */
export const createSuitePlatformNetworkModule = <
    TConfiguration extends NetworkConfiguration,
    TComponents extends NetworkComponentMap,
>(
    configuration: TConfiguration,
    implementation: NetworkConfigurationImplementation<TConfiguration, TComponents>,
): SuitePlatformNetworkModule<TComponents> => {
    // The mapped implementation type cannot be indexed by a widened id, so the pairing works on
    // the widened shape; the call-site typing has already checked it.
    const fieldComponents = implementation.send.fields as Readonly<
        Record<string, TComponents['sendField']>
    >;
    const fields: readonly SendFieldContribution<TComponents['sendField']>[] =
        configuration.send.fields.map(declaration => ({
            declaration,
            component: fieldComponents[declaration.id],
        }));
    const send: NetworkSendModule<TComponents> = {
        fee: configuration.send.fee,
        strategy: implementation.send.strategy,
        fields,
        feeSelector: implementation.send.feeSelector,
    };

    return {
        getSupportedNetworks: () => asNetworkSymbols(configuration.supportedNetworks),
        getSend: () => send,
    };
};
