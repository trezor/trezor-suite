import { type YieldDto } from '@suite-common/earn-stablecoin-defs';
import { commonQueryKeys, useQuery } from '@suite-common/react-query';

import { YIELD_OPPORTUNITIES_DEFAULT_LIMIT, queriesStaleTime } from '../config';
import { getYields } from '../services';

type UseAllYieldOpportunitiesProps = {
    limit?: number;
    enabled?: boolean;
};

const stableEmptyArray: YieldDto[] = [];

export const useAllYieldOpportunities = ({
    limit = YIELD_OPPORTUNITIES_DEFAULT_LIMIT,
    enabled = true,
}: UseAllYieldOpportunitiesProps = {}) =>
    useQuery({
        queryKey: commonQueryKeys.yieldOpportunitiesList({ limit }),
        queryFn: async ({ signal }) => {
            const { items } = await getYields({
                params: { offset: 0, limit, sort: 'statusEnterDesc' },
                signal,
            });

            return items ?? stableEmptyArray;
        },
        enabled,
        staleTime: queriesStaleTime.getYieldOpportunities,
    });
