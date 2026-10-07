import type { NetworkSymbol } from '@trezor/network-module-types';

import type { AccountType } from '../SuiteCommonNetworkConfig';

/**
 * One account on one chain: the unit every chain query is keyed by.
 *
 * A user-facing account may span several chains (one EVM address on Ethereum and its L2s), so it
 * is a list of these rather than a single symbol. The descriptor is confidential: it may sit in an
 * in-memory query key but must never be logged, reported or put into a request URL.
 */
export type ChainAccountRef = {
    readonly symbol: NetworkSymbol;
    readonly descriptor: string;
    readonly accountType: AccountType;

    /**
     * Backend connection the account is fetched through, for backends that keep one connection per
     * wallet (EVM Blockbook). It is passed at call time only and never belongs in a query key.
     */
    readonly connectionIdentity?: string;
};
