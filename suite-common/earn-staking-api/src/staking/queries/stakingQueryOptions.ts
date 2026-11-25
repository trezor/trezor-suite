import { commonQueryKeys, queryOptions } from '@suite-common/react-query';

import type { StakingEthereumValidatorsQueueParams } from '../../api/types';
import { getEthereumValidatorsQueue, getStakingStats } from '../services';

export const getStakingStatsQueryOptions = (networkSymbol: 'eth' | 'sol') =>
    queryOptions({
        queryKey: commonQueryKeys.stakingStats(networkSymbol),
        queryFn: ({ signal }) => getStakingStats({ routeParams: { networkSymbol }, signal }),
    });

export const getEthereumValidatorsQueueQueryOptions = (
    params?: StakingEthereumValidatorsQueueParams,
) =>
    queryOptions({
        queryKey: commonQueryKeys.stakingValidatorsQueue(params),
        queryFn: ({ signal }) => getEthereumValidatorsQueue({ params, signal }),
    });
