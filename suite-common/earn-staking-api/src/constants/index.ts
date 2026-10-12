export const earnStakingWorkerBaseUrls = [
    'https://earn.trezor.io/staking/v1',
    'https://dev-earn.suite.sldev.cz/staking/v1',
    'http://localhost:3001/staking/v1',
] as const;

export type EarnStakingWorkerBaseUrl = (typeof earnStakingWorkerBaseUrls)[number];
