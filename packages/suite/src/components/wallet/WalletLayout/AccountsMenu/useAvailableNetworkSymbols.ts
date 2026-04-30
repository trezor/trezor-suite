import { SPARK_NETWORK_SYMBOL, selectIsSparkEnabled } from '@suite-common/spark';
import { getNetwork } from '@suite-common/wallet-config';
import { selectEnabledNetworks } from '@suite-common/wallet-core';

import { useNetworkSupport } from 'src/hooks/settings/useNetworkSupport';
import { useSelector } from 'src/hooks/suite';
import { type AccountSearchCoinFilter } from 'src/reducers/wallet/accountSearchReducer';

// cspell:ignore Mainnets
export const useAvailableNetworkSymbols = () => {
    const enabledNetworks = useSelector(selectEnabledNetworks);
    const isSparkEnabled = useSelector(selectIsSparkEnabled);
    const { supportedMainnets: supportedPrimaryNetworks, supportedTestnets } = useNetworkSupport();

    const supportedNetworkSymbols = [...supportedPrimaryNetworks, ...supportedTestnets].map(
        network => network.symbol,
    );

    const availableNetworksSymbols = enabledNetworks.filter(networkSymbol => {
        // if the testnet is enabled, show it even though testnets are disabled in experimental features
        const isTestnet = getNetwork(networkSymbol).testnet;

        return isTestnet || supportedNetworkSymbols.includes(networkSymbol);
    });

    return [
        ...availableNetworksSymbols,
        ...(isSparkEnabled ? [SPARK_NETWORK_SYMBOL] : []),
    ] as AccountSearchCoinFilter[];
};
