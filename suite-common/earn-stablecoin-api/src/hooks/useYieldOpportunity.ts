import { type YieldDtoV2 } from '@suite-common/earn-stablecoin-defs';
import { commonQueryKeys, useQuery } from '@suite-common/react-query';

import { getYield } from '../services';

interface UseYieldOpportunityProps<
    T extends YieldDtoV2[keyof YieldDtoV2] | YieldDtoV2 = YieldDtoV2,
> {
    select?: (yieldOpportunity: YieldDtoV2) => T;
}

export function useYieldOpportunity<
    T extends YieldDtoV2[keyof YieldDtoV2] | YieldDtoV2 = YieldDtoV2,
>(vaultId: string | undefined, { select }: UseYieldOpportunityProps<T> = {}) {
    return useQuery({
        enabled: Boolean(vaultId),
        queryKey: commonQueryKeys.yieldOpportunity(vaultId),
        queryFn: ({ signal }) =>
            getYield({
                routeParams: { vaultId: vaultId! },
                signal,
            }),
        select,
    });
}
