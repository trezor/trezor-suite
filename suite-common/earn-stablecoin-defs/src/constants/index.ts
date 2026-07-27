export const earnYieldWorkerBaseUrls = [
    'https://earn.trezor.io/yield',
    'https://dev-earn.suite.sldev.cz/yield',
    'http://localhost:3001/yield',
] as const;

export type EarnYieldWorkerBaseUrl = (typeof earnYieldWorkerBaseUrls)[number];
