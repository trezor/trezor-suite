import { type YieldDto } from '@suite-common/earn-stablecoin-defs';
import { commonQueryKeys, useQuery } from '@suite-common/react-query';

import { getYield } from '../services';

interface UseYieldOpportunityProps<T extends YieldDto[keyof YieldDto] | YieldDto = YieldDto> {
    select?: (yieldOpportunity: YieldDto) => T;
}

export function useYieldOpportunity<T extends YieldDto[keyof YieldDto] | YieldDto = YieldDto>(
    vaultId: string | undefined,
    { select }: UseYieldOpportunityProps<T> = {},
) {
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
