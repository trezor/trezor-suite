import { type AllowedQueryKey } from '@suite-common/react-query';

export const desktopQueryKeys = {
    defaultUrls: (symbol: string) => ['default-urls', symbol],
    proxyImage: (src?: string) => ['proxy-image', src],
    inactiveTokens: (symbol: string, accountKey?: string) =>
        accountKey ? ['inactive-tokens', symbol, accountKey] : ['inactive-tokens', symbol],
    // `lastKnownNonce` (account.misc.nonce) is part of the key, not just an input to the fetcher —
    // when it changes (e.g. a delayed accountsActions.updateAccount lands after a transaction was
    // already added to the store), the query must be treated as brand new and refetched, rather
    // than keeping whichever value happened to be current at the first-ever mount forever.
    evmConfirmedNonce: (symbol: string, descriptor: string, lastKnownNonce: string) => [
        'evm-confirmed-nonce',
        symbol,
        descriptor,
        lastKnownNonce,
    ],
} as const satisfies Record<string, AllowedQueryKey>;
