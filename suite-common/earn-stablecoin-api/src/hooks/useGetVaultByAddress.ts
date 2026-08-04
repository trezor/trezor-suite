import { type YieldDtoV2, type YieldDtoV2Output } from '@suite-common/earn-stablecoin-defs';
import { type UseQueryResult, commonQueryKeys, useQuery } from '@suite-common/react-query';

import { getYields } from '../services';

interface GetVaultByAddressProps {
    enabled?: boolean;
    /** vault (share token) contract address — the vault's own on-chain identity */
    outputToken: string | undefined;
    /** scopes the lookup to one network, as the same address can exist on several of them */
    network?: YieldDtoV2['network'];
}

export function useGetVaultByAddress({
    enabled,
    outputToken,
    network,
}: GetVaultByAddressProps): UseQueryResult<YieldDtoV2Output | null, Error> {
    return useQuery({
        enabled: Boolean(enabled && outputToken),
        queryKey: commonQueryKeys.yieldOpportunitiesByAddress({ outputToken, network }),
        async queryFn({ signal }) {
            const { items } = await getYields({
                params: {
                    offset: 0,
                    limit: 1,
                    outputTokens: [outputToken!],
                    network,
                },
                signal,
            });

            return items?.[0] ?? null;
        },
    });
}
