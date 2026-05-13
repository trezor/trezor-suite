import { createHttpClient } from '@suite-common/http-client';

import { getMerkleUserRewardsResponse } from '../api/schemas';
import { MERKL_BASE_URL } from '../constants';

const merkleApi = createHttpClient({
    baseUrl: MERKL_BASE_URL,
});

export const getMerkleUserRewards = merkleApi('/users/:address/rewards', {
    method: 'GET',
    schema: getMerkleUserRewardsResponse,
});
