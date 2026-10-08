import { useMemo } from 'react';

import { desktopQueryKeys, useQuery } from '@suite-common/react-query';
import { fetchRankedTokenDefinitions } from '@suite-common/token-definitions';
import { type Network } from '@suite-common/wallet-config';

import { buildNetworkRepresentativeAssets } from './networkRepresentativeAssets';

export const useNetworkRepresentativeAssets = (networks: readonly Network[], isEnabled = true) => {
    const { data: definitions } = useQuery({
        queryKey: desktopQueryKeys.rankedTokenDefinitions(),
        queryFn: ({ signal }) => fetchRankedTokenDefinitions({ signal }),
        enabled:
            isEnabled &&
            networks.some(network => !network.testnet && network.features.includes('tokens')),
        staleTime: Infinity,
        gcTime: Infinity,
    });

    return useMemo(
        () => buildNetworkRepresentativeAssets({ networks, definitions: definitions ?? [] }),
        [networks, definitions],
    );
};
