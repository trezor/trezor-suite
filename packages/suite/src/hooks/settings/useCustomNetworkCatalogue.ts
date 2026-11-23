import { useMemo } from 'react';

import { selectIsTestnetNetworksEnabled } from '@suite/settings';
import { useEvmNetworksQuery } from '@suite-common/evm-networks-api';
import { desktopQueryKeys, useQuery } from '@suite-common/react-query';
import { networksCollection } from '@suite-common/wallet-config';
import { selectCustomEvmNetworks } from '@suite-common/wallet-core';

import { useSelector } from '#src/hooks/suite/useSelector';
import { type CustomNetworkCatalogueEntry } from '#src/utils/settings/customNetworks/customNetworkCatalogue';
import { buildRemoteChainCatalogue } from '#src/utils/settings/customNetworks/remoteChainCatalogue';
import {
    buildViemChainCatalogue,
    loadViemChainCatalogue,
} from '#src/utils/settings/customNetworks/viemChainCatalogue';

export const useCustomNetworkCatalogue = () => {
    const isTestnetNetworksEnabled = useSelector(selectIsTestnetNetworksEnabled);
    const customEvmNetworks = useSelector(selectCustomEvmNetworks);
    const evmNetworksQuery = useEvmNetworksQuery();
    // An empty list would leave the picker blank with no error, so it falls back like a failure.
    const remoteNetworks = evmNetworksQuery.data?.networks.length
        ? evmNetworksQuery.data.networks
        : undefined;
    // A failed first attempt already counts, so the fallback does not wait out every retry.
    const hasRemoteFailed =
        evmNetworksQuery.isError ||
        evmNetworksQuery.failureCount > 0 ||
        (evmNetworksQuery.isSuccess && !remoteNetworks);
    // The chain list ships with the app, so it never changes once its chunk is loaded.
    const viemChainsQuery = useQuery({
        queryKey: desktopQueryKeys.viemChainCatalogue(),
        queryFn: loadViemChainCatalogue,
        staleTime: Infinity,
        gcTime: Infinity,
        // Desktop loads the chunk from disk, so going offline must not hold it back.
        networkMode: 'always',
        enabled: !remoteNetworks && hasRemoteFailed,
    });
    const viemChains = viemChainsQuery.data;

    const networks = useMemo((): CustomNetworkCatalogueEntry[] => {
        const params = {
            excludedChainIds: new Set<number>([
                ...networksCollection.flatMap(({ chainId }) =>
                    chainId === undefined ? [] : [chainId],
                ),
                ...customEvmNetworks.map(({ chainId }) => chainId),
            ]),
            includeTestnets: isTestnetNetworksEnabled,
        };

        if (remoteNetworks) {
            return buildRemoteChainCatalogue(remoteNetworks, params);
        }

        return viemChains ? buildViemChainCatalogue(viemChains, params) : [];
    }, [remoteNetworks, viemChains, customEvmNetworks, isTestnetNetworksEnabled]);

    return {
        networks,
        isLoading: !remoteNetworks && !viemChains && !viemChainsQuery.isError,
        hasError: !remoteNetworks && viemChainsQuery.isError,
    };
};
