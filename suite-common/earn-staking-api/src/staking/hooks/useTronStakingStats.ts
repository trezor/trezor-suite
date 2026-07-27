import { type ResponseError, type ResponseValidationError } from '@suite-common/http-client';
import { type UseQueryOptions, commonQueryKeys, useQuery } from '@suite-common/react-query';

import { type TrxStats } from '../../api/types';
import { getTronStakingStats } from '../services';

export function useTronStakingStats(
    queryOptions?: Partial<UseQueryOptions<TrxStats, ResponseError | ResponseValidationError>>,
) {
    const stats = useQuery({
        staleTime: 5 * 60 * 1000, // 5 minutes
        ...queryOptions,
        queryKey: commonQueryKeys.tronStakingStats(),
        queryFn: getTronStakingStats,
    });

    const maxApr = stats.data?.length ? Math.max(...stats.data.map(({ apr }) => apr)) : null;
    const formattedMaxApr = maxApr ? Number(maxApr.toFixed(2)) : null;

    return { stats, maxApr, formattedMaxApr };
}
