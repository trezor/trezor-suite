import { selectEnabledNetworks } from '@suite-common/wallet-core';

import { useNetworkSupport } from '../../../../hooks/settings/useNetworkSupport';
import { useSelector } from '../../../../hooks/suite';

export const useAvailableNetworkSymbols = () => {
    const enabledNetworks = useSelector(selectEnabledNetworks);
    const { supportedMainnets, supportedTestnets } = useNetworkSupport();

    const supportedNetworkSymbols = [...supportedMainnets, ...supportedTestnets].map(
        network => network.symbol,
    );

    const availableNetworksSymbols = enabledNetworks.filter(networkSymbol =>
        supportedNetworkSymbols.includes(networkSymbol),
    );

    return availableNetworksSymbols;
};
