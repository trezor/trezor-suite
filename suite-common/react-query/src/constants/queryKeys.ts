import type { AllowedQueryKey } from '../types';

export const commonQueryKeys = {
    networkTxSimulation: (input?: any) => ['network-tx-simulation', input],
    dappScan: (url?: string) => ['dapp-scan', url],
    validatorsQueue: (accountKey: string | undefined, timestamp?: number) => [
        'everstake',
        'validatorsQueue',
        accountKey,
        timestamp ?? 'no-ts',
    ],
    resolveNamedAddress: (symbol: string, value: string) => [
        'resolve-named-address',
        symbol,
        value,
    ],
    solanaRewards: (...args: any[]) => ['solana-rewards', ...args],
    solanaRewardsTotal: (address: string) => ['solana-rewards-total', address],
    tronStakingStats: () => ['tron-staking-stats'],
    yieldOpportunity: (vaultId: string | undefined) => ['yield-opportunities', 'single', vaultId],
    yieldOpportunitiesList: (params: { limit: number }) => ['yield-opportunities', 'list', params],
    yieldOpportunitiesByAddress: (params: { outputToken?: string; network?: string }) => [
        'yield-opportunities',
        'by-address',
        params,
    ],
    yieldOpportunitiesPages: (params: { limit: number; sort: string }) => [
        'yield-opportunities',
        'pages',
        params,
    ],
    merklRewards: (...args: any[]) => ['merkl-rewards', ...args],
    missingRateTickers: (...args: any[]) => ['missing-rate-tickers', ...args],
    // `lastKnownNonce` (account.misc.nonce) is part of the key, not just an input to the fetcher —
    // when it changes (e.g. a delayed accountsActions.updateAccount lands after a tx was already
    // added to the store), the query must be treated as brand new and refetched, rather than
    // keeping whichever value happened to be current at the first-ever mount forever.
    evmConfirmedNonce: (symbol: string, descriptor: string, lastKnownNonce: string) => [
        'evm-confirmed-nonce',
        symbol,
        descriptor,
        lastKnownNonce,
    ],
    // The Stellar runtime is a lazily imported chunk; the metadata is the published token
    // definitions. Both are the same for every account, so they share one cache entry each and
    // every per-token key below is served from them.
    stellarRuntime: () => ['stellar', 'runtime'],
    stellarTokenMetadata: () => ['stellar', 'token-metadata'],
    stellarTokenInfo: (contract: string) => ['stellar', 'token-info', contract],
    stellarContractAsset: (contractId: string) => ['stellar', 'contract-asset', contractId],
    // The balances of a whole contract list in one entry, because the runtime reads them as one
    // batch of ledger keys: an entry per contract would turn that batch into a request per token.
    stellarContractBalances: (descriptor: string, contracts: readonly string[]) => [
        'stellar',
        'contract-balances',
        descriptor,
        contracts.join(','),
    ],
} as const satisfies Record<string, AllowedQueryKey>;

export const desktopQueryKeys = {
    // The fetched graph data is stored in redux (`wallet.graph`), the query itself only drives the
    // fetching — `newestConfirmedTxids` is what makes it refetch once a transaction the graph data
    // doesn't include yet gets mined. See `useTransactionGraphUpdater`.
    accountGraphUpdate: (accountKey: string | undefined, newestConfirmedTxids: string) => [
        'account-graph-update',
        accountKey,
        newestConfirmedTxids,
    ],
    composeEvmCancelTx: (accountKey: string, txid: string) => [
        'compose-evm-cancel-tx',
        accountKey,
        txid,
    ],
    defaultUrls: (symbol: string) => ['default-urls', symbol],
    proxyImage: (src?: string) => ['proxy-image', src],
} as const satisfies Record<string, AllowedQueryKey>;

export const tradingQueryKeys = {
    otcData: () => ['trading', 'otc-data'],
} as const satisfies Record<string, AllowedQueryKey>;
