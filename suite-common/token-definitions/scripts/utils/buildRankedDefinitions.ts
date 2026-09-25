import { RankedTokenStructure } from '../../src/tokenDefinitionsTypes';
import { UNKNOWN_MARKET_CAP } from '../constants';

/**
 * Flatten the per-platform contract addresses into a single list ranked by market cap, so that a
 * consumer can rank tokens across chains without fetching and merging every platform file.
 *
 * Tokens CoinGecko reports no market cap for carry no ranking information and are left out; the
 * per-platform definitions remain the complete list of known tokens. Equal market caps are ordered
 * by platform and address, so that two runs over unchanged data produce an identical file.
 */
export const buildRankedDefinitions = (
    marketCapsByPlatform: Map<string, Map<string, number>>,
): RankedTokenStructure => {
    const ranked: RankedTokenStructure = [];

    for (const [assetPlatformId, marketCaps] of marketCapsByPlatform) {
        for (const [address, marketCap] of marketCaps) {
            if (marketCap === UNKNOWN_MARKET_CAP) continue;

            ranked.push({ assetPlatformId, address, marketCap });
        }
    }

    return ranked.sort(
        (a, b) =>
            b.marketCap - a.marketCap ||
            a.assetPlatformId.localeCompare(b.assetPlatformId) ||
            a.address.localeCompare(b.address),
    );
};
