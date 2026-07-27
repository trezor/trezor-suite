import { type YieldDtoV2Output } from '@suite-common/earn-stablecoin-defs';
import { type UseQueryResult, commonQueryKeys, useQuery } from '@suite-common/react-query';

import { getYields } from '../services';

interface GetVaultByAddressProps {
    enabled?: boolean;
    outputToken: string | undefined;
}

export function useGetVaultByAddress({
    enabled,
    outputToken,
}: GetVaultByAddressProps): UseQueryResult<YieldDtoV2Output | null, Error> {
    return useQuery({
        enabled: Boolean(enabled && outputToken),
        queryKey: commonQueryKeys.yieldOpportunitiesByAddress(outputToken),
        async queryFn() {
            const { items } = await getYields({
                params: {
                    offset: 0,
                    limit: 1,
                    outputTokens: [outputToken!],
                },
            });

            return items?.[0] ?? null;
        },
    });
}
