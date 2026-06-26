import type z from 'zod';

import { type GetYieldsQueryParams } from '@suite-common/earn-stablecoin-defs';
import { commonQueryKeys, useInfiniteQuery } from '@suite-common/react-query';

import { YIELD_OPPORTUNITIES_DEFAULT_LIMIT, queriesStaleTime } from '../config';
import { getYields } from '../services';

export interface UseGetYieldOpportunitiesProps {
    limit?: number;
    sort?: z.infer<typeof GetYieldsQueryParams>['sort'];
    enabled?: boolean;
}

/**
 * Paginated list of Yield opportunities — each `fetchNextPage()` loads the next offset.
 */
export function useGetYieldOpportunities({
    limit = YIELD_OPPORTUNITIES_DEFAULT_LIMIT,
    sort = 'statusEnterDesc',
    enabled = true,
}: UseGetYieldOpportunitiesProps = {}) {
    return useInfiniteQuery({
        queryKey: commonQueryKeys.yieldOpportunitiesPages({ limit, sort }),
        queryFn: ({ pageParam, signal }) =>
            getYields({ params: { offset: pageParam, limit, sort }, signal }),
        initialPageParam: 0,
        getNextPageParam: lastPage => {
            const nextOffset = lastPage.offset + (lastPage.items?.length ?? 0);

            return nextOffset < lastPage.total ? nextOffset : undefined;
        },
        enabled,
        staleTime: queriesStaleTime.getYieldOpportunities,
    });
}
