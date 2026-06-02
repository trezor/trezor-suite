import { type YieldDto } from '@suite-common/earn-stablecoin-defs';
import { commonQueryKeys, useQuery } from '@suite-common/react-query';

import { YIELD_OPPORTUNITIES_DEFAULT_LIMIT, queriesStaleTime } from '../config';
import { useGetYieldOpportunities } from './useGetYieldOpportunities';

type UseAllYieldOpportunitiesProps = {
    limit?: number;
    enabled?: boolean;
};

const stableEmptyArray: YieldDto[] = [];

export const useAllYieldOpportunities = ({
    limit = YIELD_OPPORTUNITIES_DEFAULT_LIMIT,
    enabled = true,
}: UseAllYieldOpportunitiesProps = {}) => {
    const { mutateAsync } = useGetYieldOpportunities({});

    const queryResult = useQuery({
        queryKey: commonQueryKeys.yieldOpportunities({ limit }),
        queryFn: async () => {
            const response = await mutateAsync({ offset: 0, limit });

            return response.items;
        },
        enabled,
        staleTime: queriesStaleTime.getYieldOpportunities,
    });

    return {
        ...queryResult,
        data: queryResult.data ?? stableEmptyArray,
    };
};
