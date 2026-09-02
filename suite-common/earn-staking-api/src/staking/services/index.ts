import { createHttpClient } from '@suite-common/http-client';

import {
    reportStakingTxIdsResponse,
    stakingBatchResponse,
    stakingCardanoPoolsResponse,
    stakingEthereumValidatorsQueueResponse,
    stakingSolanaRewardsHistoryResponse,
    stakingSolanaRewardsTotalResponse,
    stakingStatsResponse,
    stakingTrxStatsResponse,
} from '../../api/schemas';
import type {
    AdaPools,
    EthOrSolStats,
    EthValidatorsQueue,
    ReportStakingTxIds,
    SolRewardsHistory,
    SolRewardsTotal,
    StakingBatch,
    StakingBatchParams,
    StakingCardanoPoolsParams,
    StakingEthereumValidatorsQueueParams,
    StakingSolanaRewardsHistoryParams,
    TrxStats,
} from '../../api/types';
import { EARN_API_BASE_URL } from '../../constants';

export const earnHttpClient = createHttpClient({
    baseUrl: EARN_API_BASE_URL,
});

type RequestOptions = { signal?: AbortSignal };
type StakingBatchNetwork = Exclude<StakingBatchParams['networks'], string | undefined>[number];
type StakingBatchRequestParams = Omit<StakingBatchParams, 'networks'> & {
    networks?: StakingBatchParams['networks'] | readonly StakingBatchNetwork[];
};

export const getStakingBatch: (
    options?: RequestOptions & { params?: StakingBatchRequestParams },
) => Promise<StakingBatch> = earnHttpClient('/', {
    method: 'GET',
    schema: stakingBatchResponse,
    timeout: 60_000,
});

export const getStakingStats: (
    options: RequestOptions & { routeParams: { networkSymbol: 'eth' | 'sol' } },
) => Promise<EthOrSolStats> = earnHttpClient('/:networkSymbol/stats', {
    method: 'GET',
    schema: stakingStatsResponse,
});

export const getTronStakingStats: (options?: RequestOptions) => Promise<TrxStats> = earnHttpClient(
    '/trx/stats',
    {
        method: 'GET',
        schema: stakingTrxStatsResponse,
    },
);

export const getEthereumValidatorsQueue: (
    options?: RequestOptions & { params?: StakingEthereumValidatorsQueueParams },
) => Promise<EthValidatorsQueue> = earnHttpClient('/eth/validators-queue', {
    method: 'GET',
    schema: stakingEthereumValidatorsQueueResponse,
});

export const getCardanoPools: (
    options?: RequestOptions & { params?: StakingCardanoPoolsParams },
) => Promise<AdaPools> = earnHttpClient('/ada/pools', {
    method: 'GET',
    schema: stakingCardanoPoolsResponse,
});

export const getSolanaRewardsHistory: (
    options: RequestOptions & {
        routeParams: { address: string };
        params?: StakingSolanaRewardsHistoryParams;
    },
) => Promise<SolRewardsHistory> = earnHttpClient('/sol/rewards/:address', {
    method: 'GET',
    schema: stakingSolanaRewardsHistoryResponse,
});

export const getSolanaRewardsTotal: (
    options: RequestOptions & { routeParams: { address: string } },
) => Promise<SolRewardsTotal> = earnHttpClient('/sol/rewards/:address/total', {
    method: 'GET',
    schema: stakingSolanaRewardsTotalResponse,
});

export const reportStakingTxIds: (
    options: RequestOptions & { body: ReportStakingTxIds },
) => Promise<unknown> = earnHttpClient('/report', {
    method: 'POST',
    schema: reportStakingTxIdsResponse,
    timeout: 60_000,
});
