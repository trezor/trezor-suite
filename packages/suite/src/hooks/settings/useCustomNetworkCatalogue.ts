import { useMemo } from 'react';

import { selectIsTestnetNetworksEnabled } from '@suite/settings';
import { desktopQueryKeys, useQuery } from '@suite-common/react-query';
import { networksCollection } from '@suite-common/wallet-config';
import { selectCustomEvmNetworks } from '@suite-common/wallet-core';

import { useSelector } from '#src/hooks/suite/useSelector';
import {
    buildViemChainCatalogue,
    loadViemChainCatalogue,
} from '#src/utils/settings/customNetworks/viemChainCatalogue';

export const useCustomNetworkCatalogue = () => {
    const isTestnetNetworksEnabled = useSelector(selectIsTestnetNetworksEnabled);
    const customEvmNetworks = useSelector(selectCustomEvmNetworks);
    // The chain list ships with the app, so it never changes once its chunk is loaded.
    const {
        data: chains,
        isPending,
        isError,
    } = useQuery({
        queryKey: desktopQueryKeys.viemChainCatalogue(),
        queryFn: loadViemChainCatalogue,
        staleTime: Infinity,
        gcTime: Infinity,
        // Desktop loads the chunk from disk, so going offline must not hold it back.
        networkMode: 'always',
    });

    const networks = useMemo(() => {
        if (!chains) {
            return [];
        }

        const excludedChainIds = new Set<number>([
            ...networksCollection.flatMap(({ chainId }) =>
                chainId === undefined ? [] : [chainId],
            ),
            ...customEvmNetworks.map(({ chainId }) => chainId),
        ]);

        return buildViemChainCatalogue(chains, {
            excludedChainIds,
            includeTestnets: isTestnetNetworksEnabled,
        });
    }, [chains, customEvmNetworks, isTestnetNetworksEnabled]);

    return { networks, isLoading: isPending, hasError: isError };
};
