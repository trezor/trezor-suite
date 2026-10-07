import type { ChainAccountRef } from '@trezor/network-module-suite-common-types';

/**
 * An account as the user sees it: one or more accounts on chains that share it. Today every
 * account lives on a single chain; an EVM address used on Ethereum and its L2s is the case this
 * shape is for. Aggregations reduce over `chainAccounts`, never over a single symbol.
 */
export type PortfolioAccount = {
    readonly id: string;
    readonly chainAccounts: readonly ChainAccountRef[];
};
