import { Timestamp } from '@suite-common/wallet-types';

import type { StakeState } from '../stakeReducer';

export const fetchEverstakeDataPending: {
    description: string;
    initialState: Partial<StakeState>;
    actionPayload: { symbol: 'eth'; endpointType: string };
    result: StakeState['data'];
}[] = [
    {
        description: 'initial eth poolStats + validatorsQueue created',
        initialState: {
            data: {},
        },
        actionPayload: { symbol: 'eth', endpointType: 'poolStats' },
        result: {
            eth: {
                poolStats: {
                    error: false,
                    isLoading: true,
                    lastSuccessfulFetchTimestamp: 0 as Timestamp,
                    data: null,
                },
            },
        },
    },
];

export const fetchEverstakeDataFulfilled = [
    {
        description: 'poolStats updated on fulfilled',
        initialState: {
            data: {
                eth: {
                    poolStats: {
                        error: false,
                        isLoading: true,
                        lastSuccessfulFetchTimestamp: 0 as Timestamp,
                        data: null,
                    },
                },
            },
        },
        actionPayload: { symbol: 'eth', endpointType: 'poolStats' },
        payload: { ethApy: 5, nextRewardPayout: 3 },
        result: {
            eth: {
                poolStats: {
                    error: false,
                    isLoading: false,
                    lastSuccessfulFetchTimestamp: expect.any(Number) as Timestamp,
                    data: { ethApy: 5, nextRewardPayout: 3 },
                },
            },
        },
    },
];

export const fetchEverstakeDataRejected = [
    {
        description: 'sets error state for eth.poolStats when request fails',
        initialState: {
            data: {
                eth: {
                    poolStats: {
                        error: false,
                        isLoading: true,
                        lastSuccessfulFetchTimestamp: 123456 as Timestamp,
                        data: { ethApy: 1, nextRewardPayout: 0 },
                    },
                },
            },
        },
        actionPayload: {
            symbol: 'eth',
            endpointType: 'poolStats',
            error: 'Network error',
        },
        result: {
            eth: {
                poolStats: {
                    error: true,
                    isLoading: false,
                    lastSuccessfulFetchTimestamp: 0 as Timestamp,
                    data: null,
                },
            },
        },
    },
];

export const fetchEverstakeStakingInfoPending: {
    description: string;
    initialState: Partial<StakeState>;
    actionPayload: { symbol: 'ada' | 'sol'; endpointType: 'stakingInfo' };
    result: StakeState['data'];
}[] = [
    {
        description: 'initial stakingInfo created for ADA',
        initialState: { data: {} },
        actionPayload: { symbol: 'ada', endpointType: 'stakingInfo' },
        result: {
            ada: {
                stakingInfo: {
                    error: false,
                    isLoading: true,
                    lastSuccessfulFetchTimestamp: 0 as Timestamp,
                    data: null,
                },
            },
        },
    },
];

export const fetchEverstakeStakingInfoFulfilled = [
    {
        description: 'stakingInfo updated on fulfilled (SOL)',
        initialState: {
            data: {
                sol: {
                    stakingInfo: {
                        error: false,
                        isLoading: true,
                        lastSuccessfulFetchTimestamp: 0 as Timestamp,
                        data: null,
                    },
                },
            },
        },
        actionPayload: { symbol: 'sol', endpointType: 'stakingInfo' },
        payload: { apy: 7.5 },
        result: {
            sol: {
                stakingInfo: {
                    error: false,
                    isLoading: false,
                    lastSuccessfulFetchTimestamp: expect.any(Number) as Timestamp,
                    data: { apy: 7.5 },
                },
            },
        },
    },
    {
        description: 'stakingInfo updated on fulfilled (ADA)',
        initialState: {
            data: {
                ada: {
                    stakingInfo: {
                        error: false,
                        isLoading: true,
                        lastSuccessfulFetchTimestamp: 0 as Timestamp,
                        data: null,
                    },
                },
            },
        },
        actionPayload: { symbol: 'ada', endpointType: 'stakingInfo' },
        payload: {
            pools: [
                {
                    apy: 4.2,
                    saturation: 76.53,
                    id: 'poolid1',
                },
                {
                    apy: 4.3,
                    saturation: 16.53,
                    id: 'poolid2',
                },
            ],
        },
        result: {
            ada: {
                stakingInfo: {
                    error: false,
                    isLoading: false,
                    lastSuccessfulFetchTimestamp: expect.any(Number) as Timestamp,
                    data: {
                        pools: [
                            {
                                apy: 4.2,
                                saturation: 76.53,
                                id: 'poolid1',
                            },
                            {
                                apy: 4.3,
                                saturation: 16.53,
                                id: 'poolid2',
                            },
                        ],
                    },
                },
            },
        },
    },
];

export const fetchEverstakeStakingInfoRejected = [
    {
        description: 'sets error state for SOL stakingInfo when request fails',
        initialState: {
            data: {
                sol: {
                    stakingInfo: {
                        error: false,
                        isLoading: true,
                        lastSuccessfulFetchTimestamp: 1111 as Timestamp,
                        data: { apy: 3 },
                    },
                },
            },
        },
        actionPayload: {
            symbol: 'sol',
            endpointType: 'stakingInfo',
        },
        result: {
            sol: {
                stakingInfo: {
                    error: true,
                    isLoading: false,
                    lastSuccessfulFetchTimestamp: 0 as Timestamp,
                    data: null,
                },
            },
        },
    },
];

export const fetchEverstakeRewardsPending = [
    {
        description: 'initial stakingRewards created for SOL',
        initialState: { data: {} },
        actionPayload: {
            symbol: 'sol',
            endpointType: 'stakingRewards',
            address: 'Addr111',
        },
        result: {
            sol: {
                stakingRewards: {
                    error: false,
                    isLoading: true,
                    lastSuccessfulFetchTimestamp: 0 as Timestamp,
                    data: null,
                },
            },
        },
    },
];

export const fetchEverstakeRewardsFulfilled = [
    {
        description: 'stakingRewards updated on fulfilled',
        initialState: {
            data: {
                sol: {
                    stakingRewards: {
                        error: false,
                        isLoading: true,
                        lastSuccessfulFetchTimestamp: 0 as Timestamp,
                        data: null,
                    },
                },
            },
        },
        actionPayload: {
            symbol: 'sol',
            endpointType: 'stakingRewards',
        },
        payload: {
            rewardsHistory: { Addr111: [{ epoch: 1, reward: 10 }] },
            totalRewards: { Addr111: '10' },
        },
        result: {
            sol: {
                stakingRewards: {
                    error: false,
                    isLoading: false,
                    lastSuccessfulFetchTimestamp: expect.any(Number) as Timestamp,
                    data: {
                        rewardsHistory: { Addr111: [{ epoch: 1, reward: 10 }] },
                        totalRewards: { Addr111: '10' },
                    },
                },
            },
        },
    },
];

export const fetchEverstakeRewardsRejected = [
    {
        description: 'error state for stakingRewards when request fails',
        initialState: {
            data: {
                sol: {
                    stakingRewards: {
                        error: false,
                        isLoading: true,
                        lastSuccessfulFetchTimestamp: 123 as Timestamp,
                        data: { rewardsHistory: {}, totalRewards: {} },
                    },
                },
            },
        },
        actionPayload: {
            symbol: 'sol',
            endpointType: 'stakingRewards',
        },
        result: {
            sol: {
                stakingRewards: {
                    error: true,
                    isLoading: false,
                    lastSuccessfulFetchTimestamp: 0 as Timestamp,
                    data: null,
                },
            },
        },
    },
];
