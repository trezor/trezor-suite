import { useEffect, useMemo, useState } from 'react';

import { selectIsDebugModeActive } from '@suite/debug';
import { networksCollection } from '@suite-common/wallet-config';
import { selectCustomEvmNetworks } from '@suite-common/wallet-core';

import { useSelector } from 'src/hooks/suite';
import {
    type CatalogueChain,
    buildChainCatalogue,
    loadViemChainCatalogue,
} from 'src/utils/settings/customNetworks/viemChainCatalogue';

export const useCustomNetworkCatalogue = () => {
    const isDebugModeActive = useSelector(selectIsDebugModeActive);
    const customEvmNetworks = useSelector(selectCustomEvmNetworks);
    const [chains, setChains] = useState<CatalogueChain[] | null>(null);
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        let isCancelled = false;

        loadViemChainCatalogue()
            .then(loadedChains => {
                if (!isCancelled) {
                    setChains(loadedChains);
                }
            })
            .catch(() => {
                if (!isCancelled) {
                    setHasError(true);
                }
            });

        return () => {
            isCancelled = true;
        };
    }, []);

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

        return buildChainCatalogue(chains, {
            excludedChainIds,
            includeTestnets: isDebugModeActive,
        });
    }, [chains, customEvmNetworks, isDebugModeActive]);

    return { networks, isLoading: !chains && !hasError, hasError };
};
