import { commonQueryKeys, useQuery } from '@suite-common/react-query';
import {
    buildNetworkRepresentativeAssets,
    fetchRankedTokenDefinitions,
} from '@suite-common/token-definitions';
import { type Network } from '@suite-common/wallet-config';

export const useNetworkRepresentativeAssets = (networks: readonly Network[]) => {
    const { data: definitions } = useQuery({
        queryKey: commonQueryKeys.rankedTokenDefinitions(),
        queryFn: ({ signal }) => fetchRankedTokenDefinitions({ signal }),
        enabled: networks.some(network => !network.testnet && network.features.includes('tokens')),
        staleTime: Infinity,
        gcTime: Infinity,
    });

    return buildNetworkRepresentativeAssets({ networks, definitions: definitions ?? [] });
};
