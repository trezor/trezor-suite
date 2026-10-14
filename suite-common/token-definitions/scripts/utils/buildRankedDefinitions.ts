/* eslint-disable no-console */
import { RankedTokenStructure } from '../../src/tokenDefinitionsTypes';
import { UNKNOWN_MARKET_CAP } from '../constants';
import { type CoinData } from '../schemas';
import { fetchAllCoins, getContractAddress } from './fetchCoins';
import { fetchMarketCaps } from './fetchMarketCaps';

/** One coin resolved to a contract address, before its market cap is known. */
export type TokenCandidate = {
    coinId: string;
    symbol: string;
    name: string;
};

/** An address is only ever recorded together with the coin that produced it. */
export type TokenCandidates = [TokenCandidate, ...TokenCandidate[]];

/**
 * Resolve every coin CoinGecko lists on one platform to its contract address.
 *
 * This walks the coin list the way the definitions build does, but writes nothing: the ranked file
 * is built on its own, so the per-platform definitions keep the code path they have today. Several
 * coins can share a contract address, most notably Cardano assets minted under one policy id, so
 * each address collects every candidate and the winner is picked once market caps are known.
 */
export const collectPlatformTokens = async (
    allCoins: CoinData[],
    assetPlatformId: string,
): Promise<Map<string, TokenCandidates>> => {
    const tokens = new Map<string, TokenCandidates>();

    for (const { id, platforms, symbol, name } of allCoins) {
        const contractAddress = await getContractAddress(assetPlatformId, platforms);
        if (!contractAddress.success) continue;

        const candidate = { coinId: id, symbol, name };
        const candidates = tokens.get(contractAddress.payload);

        if (candidates) {
            candidates.push(candidate);
        } else {
            tokens.set(contractAddress.payload, [candidate]);
        }
    }

    return tokens;
};

export type RankTokensParams = {
    tokensByPlatform: Map<string, Map<string, TokenCandidates>>;
    marketCaps: Map<string, number>;
};

/**
 * Rank the collected tokens of every platform into one list, so that a consumer can rank tokens
 * across chains without fetching and merging every platform file.
 *
 * Every known token is listed. One CoinGecko reports no market cap for is kept with a market cap
 * of 0 and sorts last, so the file stays a complete list. Equal market caps are ordered by platform
 * and address, so that two runs over unchanged data produce an identical file.
 */
export const rankTokens = ({
    tokensByPlatform,
    marketCaps,
}: RankTokensParams): RankedTokenStructure => {
    const ranked: RankedTokenStructure = [];

    const marketCapOf = ({ coinId }: TokenCandidate) =>
        marketCaps.get(coinId) ?? UNKNOWN_MARKET_CAP;

    for (const [assetPlatformId, tokens] of tokensByPlatform) {
        for (const [address, [firstCandidate, ...otherCandidates]] of tokens) {
            // The address keeps the record of its largest coin, so that the symbol and name
            // published next to a market cap are the ones that market cap belongs to. A tie falls
            // back to the coin id, so the choice does not depend on CoinGecko's ordering.
            const { symbol, name, coinId } = otherCandidates.reduce((best, candidate) => {
                const difference = marketCapOf(candidate) - marketCapOf(best);

                return difference > 0 ||
                    (difference === 0 && candidate.coinId.localeCompare(best.coinId) < 0)
                    ? candidate
                    : best;
            }, firstCandidate);

            ranked.push({
                assetPlatformId,
                address,
                symbol,
                name,
                marketCap: marketCaps.get(coinId) ?? UNKNOWN_MARKET_CAP,
            });
        }
    }

    return ranked.toSorted(
        (a, b) =>
            b.marketCap - a.marketCap ||
            a.assetPlatformId.localeCompare(b.assetPlatformId) ||
            a.address.localeCompare(b.address),
    );
};

/**
 * Build the ranked definitions for the given platforms, from the coin list all the way to the
 * ranked records.
 *
 * Everything that decides what the published file contains lives here rather than in the script,
 * so it can be exercised without touching the disk. Nothing is caught: a coin list or market cap
 * request that fails takes the whole build with it, because a token missing from the ranking must
 * never be the quiet result of a request that did not answer.
 */
export const buildRankedDefinitions = async (
    assetPlatformIds: string[],
): Promise<RankedTokenStructure> => {
    const allCoins = await fetchAllCoins();
    const tokensByPlatform = new Map<string, Map<string, TokenCandidates>>();

    for (const assetPlatformId of assetPlatformIds) {
        console.log('Collecting tokens for:', assetPlatformId);
        const tokens = await collectPlatformTokens(allCoins, assetPlatformId);

        if (!tokens.size) {
            throw new Error(`No tokens available for platform: ${assetPlatformId}`);
        }

        console.log('Tokens found for specific platform:', tokens.size);
        tokensByPlatform.set(assetPlatformId, tokens);
    }

    // Only the coins that ended up on a supported platform are worth asking about, and each one
    // only once however many platforms it is listed on.
    const coinIds = new Set<string>();
    for (const tokens of tokensByPlatform.values()) {
        for (const candidates of tokens.values()) {
            candidates.forEach(({ coinId }) => coinIds.add(coinId));
        }
    }

    const marketCaps = await fetchMarketCaps(Array.from(coinIds));

    return rankTokens({ tokensByPlatform, marketCaps });
};
