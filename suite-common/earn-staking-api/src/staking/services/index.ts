import type z from 'zod';

import {
    type FetcherOptions,
    type StandardSchemaV1,
    createHttpClient,
} from '@suite-common/http-client';

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

function createHttpService<
    DefaultOptions extends FetcherOptions<
        typeof fetch,
        Required<StandardSchemaV1<any, any>>,
        T,
        any
    >,
    Schema extends DefaultOptions['schema'] extends infer S
        ? S extends StandardSchemaV1<infer I, infer O>
            ? StandardSchemaV1<I, O>
            : never
        : never,
    T extends z.infer<Schema>,
>(endpoint: string, options: DefaultOptions) {
    return <Options extends FetcherOptions<typeof fetch, Schema, T, any>>(
        fetcherOptions?: Options,
    ) =>
        earnHttpClient<T, Schema>(endpoint, {
            ...fetcherOptions,
            ...options,
        });
}

export const getStakingBatch = createHttpService('/staking', {
    method: 'POST',
    schema: stakingBatchResponse,
});

export const getStakingStats = createHttpService('/staking/{networkSymbol}/stats', {
    method: 'GET',
    schema: stakingStatsResponse,
});

export const getEthereumValidatorsQueue = createHttpService('/staking/eth/validators-queue', {
    method: 'GET',
    schema: stakingEthereumValidatorsQueueResponse,
});

export const getCardanoPools = createHttpService('/staking/ada/pools', {
    method: 'GET',
    schema: stakingCardanoPoolsResponse,
});

export const getSolanaRewardsHistory = createHttpService('/staking/sol/rewards/{address}', {
    method: 'GET',
    schema: stakingSolanaRewardsHistoryResponse,
});

export const getSolanaRewardsTotal = createHttpService('/staking/sol/rewards/{address}/total', {
    method: 'GET',
    schema: stakingSolanaRewardsTotalResponse,
});
