import type {
    MerklUsersRewardsRequestBody,
    MerklUsersRewardsResponseOutput,
} from '@suite-common/earn-stablecoin-defs';
import { createHttpClient } from '@suite-common/http-client';

import { earnYieldWorkerBaseUrl } from '../context';

const merklApi = createHttpClient({ fetch: (input, init) => globalThis.fetch(input, init) })({
    async baseUrl() {
        const baseUrl = await earnYieldWorkerBaseUrl.get();

        return `${baseUrl}/merkl/v1`;
    },
});

type GetMerklUsersRewardsOptions = {
    body: MerklUsersRewardsRequestBody;
    signal?: AbortSignal;
};

export const getMerklUsersRewards = async (
    options: GetMerklUsersRewardsOptions,
): Promise<MerklUsersRewardsResponseOutput> => {
    // The generated schemas are large, so they load with the first request, not with the app.
    const { GetMerklUsersRewardsResponse } = await import('@suite-common/earn-stablecoin-defs');

    return merklApi('/users/rewards', { method: 'POST', schema: GetMerklUsersRewardsResponse })(
        options,
    );
};
