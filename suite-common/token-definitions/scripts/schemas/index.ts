import { z } from 'zod';

// CoinGecko returns platforms as { [platform]: contractAddress }, where the contract can be an
// empty string or null. Normalize to only the entries that have both, so the rest of the pipeline
// can rely on a clean Record<string, string>.
const platformsSchema = z.record(z.string(), z.string().nullable()).transform(platforms =>
    Object.fromEntries(
        Object.entries(platforms).filter((entry): entry is [string, string] => {
            const [platform, contract] = entry;

            return Boolean(platform) && Boolean(contract);
        }),
    ),
);

export const coinDataSchema = z.object({
    id: z.string(),
    // A coin CoinGecko lists without a symbol or a name still belongs in the definitions, so the
    // field falls back to an empty string rather than failing the whole list.
    symbol: z.string().catch(''),
    name: z.string().catch(''),
    // Present because /coins/list is queried with include_platform=true.
    platforms: platformsSchema,
});
export type CoinData = z.infer<typeof coinDataSchema>;

export const coinListSchema = z.array(coinDataSchema);

// Only the fields the definitions are built from, with the same fallback as the coin list: one
// NFT collection CoinGecko lists without a name must not fail the whole page.
export const nftDataSchema = z.object({
    contract_address: z.string(),
    symbol: z.string().catch(''),
    name: z.string().catch(''),
});
export type NftData = z.infer<typeof nftDataSchema>;

export const nftListSchema = z.array(nftDataSchema);

// A contract that wraps no asset is a valid answer, so `asset` is read rather than required: an
// absent one leaves the token out on purpose, while a rejected response would fail the build.
export const stellarExpertContractSchema = z.object({
    asset: z.unknown(),
});

export const stellarExpertRatingSchema = z.object({
    rating: z.object({ average: z.number().nullish() }).nullish(),
});

// Horizon leaves the field out, or returns it empty, for an issuer that publishes no domain.
export const stellarAccountSchema = z.object({
    home_domain: z.string().nullish(),
});

/**
 * Mirror of the worker's `YieldVaults` schema, narrowed to the keys this script needs. Inlined to
 * keep the script free of a runtime dep on `@suite-common/earn-stablecoin-api`.
 *
 * Keyed by CoinGecko asset platform id — the same ids this script takes as CLI args — so no
 * network-symbol mapping is needed. A platform the worker does not support for vaults is absent.
 */
export const yieldDefinitionsSchema = z.record(
    z.string(),
    z.array(
        z.object({
            yieldId: z.string(),
            address: z.string(),
        }),
    ),
);
export type YieldDefinitions = z.infer<typeof yieldDefinitionsSchema>;
