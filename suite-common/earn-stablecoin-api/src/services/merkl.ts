import { GetMerklUsersRewardsResponse } from '@suite-common/earn-stablecoin-defs';
import { createHttpClient } from '@suite-common/http-client';

import { earnYieldWorkerBaseUrl } from '../context';

const merklApi = createHttpClient({ fetch: (input, init) => globalThis.fetch(input, init) })({
    async baseUrl() {
        const baseUrl = await earnYieldWorkerBaseUrl.get();

        return `${baseUrl}/merkl/v1`;
    },
});

export const getMerklUsersRewards = merklApi('/users/rewards', {
    method: 'POST',
    schema: GetMerklUsersRewardsResponse,
});
