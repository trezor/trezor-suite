import type { AllowedQueryKey } from '../types';

export const commonQueryKeys = {
    txSimulationEVM: (input?: any) => ['tx-simulation-evm', input],
    dappScan: (url?: string) => ['dapp-scan', url],
} as const satisfies Record<string, AllowedQueryKey>;

export const desktopQueryKeys = {
    defaultUrls: (symbol: string) => ['default-urls', symbol],
    proxyImage: (src?: string) => ['proxy-image', src],
    inactiveTokens: (symbol: string) => ['inactive-tokens', symbol],
    yieldOpportunities: (pagination: any) => ['yield-opportunities', pagination],
} as const satisfies Record<string, AllowedQueryKey>;

export const mobileQueryKeys = {} as const satisfies Record<string, AllowedQueryKey>;
