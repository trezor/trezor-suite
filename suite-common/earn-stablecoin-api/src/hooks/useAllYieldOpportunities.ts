import { desktopQueryKeys, useQuery } from '@suite-common/react-query';

import { EARN_QUERY_STALE_TIME, YIELD_OPPORTUNITIES_DEFAULT_LIMIT } from '../config';
import { useGetYieldOpportunities } from './useGetYieldOpportunities';

type UseAllYieldOpportunitiesProps = {
    limit?: number;
    enabled?: boolean;
};

export const useAllYieldOpportunities = ({
    limit = YIELD_OPPORTUNITIES_DEFAULT_LIMIT,
    enabled = true,
}: UseAllYieldOpportunitiesProps = {}) => {
    const { mutateAsync } = useGetYieldOpportunities({});

    const queryResult = useQuery({
        queryKey: desktopQueryKeys.yieldOpportunities({ limit }),
        queryFn: async () => {
            const { data } = await mutateAsync({ offset: 0, limit });

            return data.items;
        },
        enabled,
        staleTime: EARN_QUERY_STALE_TIME,
    });

    return {
        ...queryResult,
        yieldOpportunities: queryResult.data || [],
    };
};
