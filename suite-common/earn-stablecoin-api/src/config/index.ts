import { isCodesignBuild } from '@trezor/env-utils';

/**
 * A proxy service for yield.xyz API
 */
export const YIELD_XYZ_BASE_URL = isCodesignBuild()
    ? 'https://earn.trezor.io/yield'
    : 'https://dev-earn.suite.sldev.cz/yield';

export const MERKL_BASE_URL = isCodesignBuild()
    ? 'https://earn.trezor.io/rewards/merkl'
    : 'https://dev-earn.suite.sldev.cz/rewards/merkl';

export const YIELD_OPPORTUNITIES_DEFAULT_LIMIT = 100;

const minutes = (value: number) => value * 60 * 1000;

export const queriesStaleTime = {
    getYieldOpportunities: minutes(5),
    getMerkleRewards: minutes(5),
    getYieldProvider: minutes(5),
} as const satisfies Record<string, number>;
