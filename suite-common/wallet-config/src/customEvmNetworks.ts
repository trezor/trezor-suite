import {
    type CustomEvmNetworkConfigParams,
    buildCustomEvmNetworkConfig,
} from '@suite-common/networks';

import { type NetworkSymbol } from './networkTypes';
import { registerLegacyNetwork } from './utils';

type RegisterLegacyCustomEvmNetworkParams = CustomEvmNetworkConfigParams & {
    symbol: NetworkSymbol;
};

/**
 * Makes a custom EVM network visible to the legacy registry readers (`getNetwork`,
 * `getSupportedNetworks`, ...), which cannot see anything registered later in Redux.
 */
export const registerLegacyCustomEvmNetwork = (params: RegisterLegacyCustomEvmNetworkParams) =>
    registerLegacyNetwork(params.symbol, {
        ...buildCustomEvmNetworkConfig(params),
        symbol: params.symbol,
        yieldXyzId: null,
    });
