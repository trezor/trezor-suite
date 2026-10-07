import type { BaseCurrencyCode } from '@trezor/blockchain-link-types';
import type { NetworkSymbol } from '@trezor/network-module-types';

export type FiatRate = {
    readonly rate: number;

    /** Unix time in seconds the rate was quoted at. */
    readonly timestamp: number;
};

export type FetchCurrentFiatRateParams = {
    symbol: NetworkSymbol;
    currency: BaseCurrencyCode;
    signal: AbortSignal;
};

/**
 * Current rate of a network's native coin from a source outside the network's own backend.
 * Resolves `null` when the source has no rate for the coin.
 *
 * @serviceContract
 */
export type FetchCurrentFiatRate = (params: FetchCurrentFiatRateParams) => Promise<FiatRate | null>;

export type FetchCoinGeckoCurrentRateDep = { fetchCoinGeckoCurrentRate: FetchCurrentFiatRate };

/** Blockbook's public HTTP API, used where the account backend is not Blockbook (Electrum). */
export type FetchBlockbookHttpCurrentRateDep = {
    fetchBlockbookHttpCurrentRate: FetchCurrentFiatRate;
};
