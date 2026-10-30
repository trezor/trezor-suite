import type { Middleware, Reducer } from '@reduxjs/toolkit';
import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query';

import type { StakingProductId, StakingProductInfo } from '@suite-common/earn-staking-common';
import type { WithServices } from '@trezor/redux-utils';

import type { StakingDep } from '../stakingServices';

export type StakingApiDeps = WithServices<StakingDep>;

export const stakingApi = createApi({
    reducerPath: 'stakingApi',
    baseQuery: fakeBaseQuery<string>(),
    endpoints: build => ({
        getProductInfo: build.query<StakingProductInfo, StakingProductId>({
            queryFn: async (productId, { extra }) => {
                const { services } = extra as StakingApiDeps;

                try {
                    const info = await services.staking.stakingProductRepository
                        .get(productId)
                        .fetchProductInfo({});

                    return { data: info };
                } catch (error) {
                    const message = error instanceof Error ? error.message : 'Unknown error';

                    console.warn(`Staking product info for ${productId} failed: ${message}`);

                    return { error: message };
                }
            },
            // Positions are derived from the info, so it stays cached without a subscriber.
            keepUnusedDataFor: Infinity,
        }),
    }),
});

export type StakingApiState = ReturnType<typeof stakingApi.reducer>;

export type StakingApiRootState = {
    stakingApi: StakingApiState;
};

export const stakingApiReducer: Reducer<StakingApiState> = stakingApi.reducer;

export const stakingApiMiddleware: Middleware = stakingApi.middleware;
