import type { AllowedQueryKey } from '../types';

export const commonQueryKeys = {
    txSimulationEVM: (input?: any) => ['tx-simulation-evm', input],
    dappScan: (url?: string) => ['dapp-scan', url],
    validatorsQueue: (accountKey: string, timestamp?: number) => [
        'everstake',
        'validatorsQueue',
        accountKey,
        timestamp ?? 'no-ts',
    ],
    solanaRewards: (...args: any[]) => ['solana-rewards', ...args],
    solanaRewardsTotal: (address: string) => ['solana-rewards-total', address],
    merkleRewards: (...args: any[]) => ['merkle-rewards', ...args],
    missingRateTickers: (...args: any[]) => ['missing-rate-tickers', ...args],
} as const satisfies Record<string, AllowedQueryKey>;

export const desktopQueryKeys = {
    defaultUrls: (symbol: string) => ['default-urls', symbol],
    proxyImage: (src?: string) => ['proxy-image', src],
    inactiveTokens: (symbol: string, accountKey?: string) =>
        accountKey ? ['inactive-tokens', symbol, accountKey] : ['inactive-tokens', symbol],
    yieldOpportunities: (pagination: any) => ['yield-opportunities', pagination],
} as const satisfies Record<string, AllowedQueryKey>;

export const mobileQueryKeys = {} as const satisfies Record<string, AllowedQueryKey>;

export const tradingQueryKeys = {
    otcData: () => ['trading', 'otc-data'],
} as const satisfies Record<string, AllowedQueryKey>;
