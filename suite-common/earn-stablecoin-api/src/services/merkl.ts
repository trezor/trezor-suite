import { createHttpClient } from '@suite-common/http-client';

import { getMerklUsersRewardsResponse } from '../api/schemas';
import { MERKL_BASE_URL } from '../constants';

const merklApi = createHttpClient({
    baseUrl: MERKL_BASE_URL,
});

export const getMerklUsersRewards = merklApi('/users/rewards', {
    method: 'POST',
    schema: getMerklUsersRewardsResponse,
});
