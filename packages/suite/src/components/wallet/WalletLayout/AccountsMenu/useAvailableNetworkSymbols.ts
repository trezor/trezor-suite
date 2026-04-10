import { getNetwork } from '@suite-common/wallet-config';
import { selectEnabledNetworks } from '@suite-common/wallet-core';

import { useNetworkSupport } from 'src/hooks/settings/useNetworkSupport';
import { useSelector } from 'src/hooks/suite';

export const useAvailableNetworkSymbols = () => {
    const enabledNetworks = useSelector(selectEnabledNetworks);
    const { supportedMainnets, supportedTestnets } = useNetworkSupport();

    const supportedNetworkSymbols = [...supportedMainnets, ...supportedTestnets].map(
        network => network.symbol,
    );

    const availableNetworksSymbols = enabledNetworks.filter(networkSymbol => {
        // if the testnet is enabled, show it even though testnets are disabled in experimental features
        const isTestnet = getNetwork(networkSymbol).testnet;

        return isTestnet || supportedNetworkSymbols.includes(networkSymbol);
    });

    return availableNetworksSymbols;
};
