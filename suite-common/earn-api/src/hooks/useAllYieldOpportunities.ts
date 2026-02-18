import { desktopQueryKeys, useQuery } from '@suite-common/react-query';

import { EARN_QUERY_STALE_TIME, YIELD_OPPORTUNITIES_DEFAULT_LIMIT } from '../config';
import { useGetYieldOpportunities } from './useGetYieldOpportunities';

type UseAllYieldOpportunitiesProps = {
    limit?: number;
};

export const useAllYieldOpportunities = ({
    limit = YIELD_OPPORTUNITIES_DEFAULT_LIMIT,
}: UseAllYieldOpportunitiesProps = {}) => {
    const { mutateAsync } = useGetYieldOpportunities({});

    const query = useQuery({
        queryKey: desktopQueryKeys.yieldOpportunities({ limit }),
        queryFn: () => mutateAsync({ offset: 0, limit }),
        staleTime: EARN_QUERY_STALE_TIME,
    });

    return {
        yieldOpportunities: query.data?.data?.items ?? [],
        isYieldOpportunitiesLoading: query.isLoading,
    };
};
