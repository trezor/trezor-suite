import { createHttpClient } from '@suite-common/http-client';

import {
    stakingBatchResponse,
    stakingCardanoPoolsResponse,
    stakingEthereumValidatorsQueueResponse,
    stakingSolanaRewardsHistoryResponse,
    stakingSolanaRewardsTotalResponse,
    stakingStatsResponse,
} from '../../api/schemas';
import { EARN_API_BASE_URL } from '../../constants';

export const earnHttpClient = createHttpClient({
    baseUrl: EARN_API_BASE_URL,
});

export const getStakingBatch = earnHttpClient('/', {
    method: 'GET',
    schema: stakingBatchResponse,
});

export const getStakingStats = earnHttpClient('/:networkSymbol/stats', {
    method: 'GET',
    schema: stakingStatsResponse,
});

export const getEthereumValidatorsQueue = earnHttpClient('/eth/validators-queue', {
    method: 'GET',
    schema: stakingEthereumValidatorsQueueResponse,
});

export const getCardanoPools = earnHttpClient('/ada/pools', {
    method: 'GET',
    schema: stakingCardanoPoolsResponse,
});

export const getSolanaRewardsHistory = earnHttpClient('/sol/rewards/:address', {
    method: 'GET',
    schema: stakingSolanaRewardsHistoryResponse,
});

export const getSolanaRewardsTotal = earnHttpClient('/sol/rewards/:address/total', {
    method: 'GET',
    schema: stakingSolanaRewardsTotalResponse,
});
