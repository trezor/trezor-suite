import { MERKL_BASE_URL, getMerklUsersRewardsResponse } from '@suite-common/earn-stablecoin-defs';
import { createHttpClient } from '@suite-common/http-client';

const merklApi = createHttpClient({
    baseUrl: MERKL_BASE_URL,
});

export const getMerklUsersRewards = merklApi('/users/rewards', {
    method: 'POST',
    schema: getMerklUsersRewardsResponse,
});
