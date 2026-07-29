import { z } from 'zod';

// A corrupt entry falls back to { updatedAt: 0 } (and thus gets reprocessed) instead of
// discarding the whole checkpoint, matching the leniency of the previous unvalidated fetch.
export const updatedIconsListSchema = z.record(
    z.string(),
    z
        .object({
            updatedAt: z.number(),
            // Source image URL (incl. CoinGecko's version query param) of the last successfully
            // written icon. Used to skip coins whose logo has not changed since the previous run.
            imageUrl: z.string().optional(),
            // Fingerprint of the file set the last successful run wrote for this coin (its platform
            // contracts and the image sizes). Needed alongside imageUrl because CoinGecko keeps
            // listing existing coins on new platforms without touching their logo — matching on the
            // source image alone would skip such a coin forever and its new contract would never
            // get an icon.
            outputsHash: z.string().optional(),
        })
        .catch({ updatedAt: 0 }),
);
export type UpdatedIconsList = z.infer<typeof updatedIconsListSchema>;

// CoinGecko returns platforms as { [platform]: contractAddress }, where the contract can be an
// empty string or (on some endpoints) null. Normalize to only the entries that have both, so the
// rest of the pipeline can rely on a clean Record<string, string>.
const platformsSchema = z.record(z.string(), z.string().nullable()).transform(platforms =>
    Object.fromEntries(
        Object.entries(platforms).filter((entry): entry is [string, string] => {
            const [platform, contract] = entry;

            return Boolean(platform) && Boolean(contract);
        }),
    ),
);

export const coinListDataSchema = z.object({
    id: z.string(),
    // present because /coins/list is queried with include_platform=true
    platforms: platformsSchema,
});
export type CoinListData = z.infer<typeof coinListDataSchema>;

export const coinDataSchema = z.object({
    id: z.string(),
    platforms: platformsSchema,
    image: z.object({ large: z.string().nullish() }),
});
export type CoinData = z.infer<typeof coinDataSchema>;

// Only the fields we need; malformed entries fall back to empty values and are filtered out,
// so one bad coin cannot fail a whole page.
export const coinMarketsSchema = z.array(
    z.object({
        id: z.string(),
        image: z.string(),
    }),
);

// Yield vaults as served by the earn-yield worker, grouped by CoinGecko asset platform id. Keys are
// kept open so a newly supported platform cannot fail the whole response — a platform this repo does
// not know is reported and skipped by the consumer instead.
export const yieldVaultsSchema = z.record(
    z.string(),
    z.array(
        z.object({
            yieldId: z.string(),
            // Address of the vault-position token, i.e. the icon file name to write.
            address: z.string(),
            // Address and CoinGecko coin id of the token the vault is denominated in, i.e. the icon
            // to copy. The id is chain-specific (`l2-standard-bridged-weth-base`, not `weth`).
            underlyingToken: z.string(),
            coingeckoId: z.string(),
        }),
    ),
);
export type YieldVaults = z.infer<typeof yieldVaultsSchema>;
export type YieldVault = YieldVaults[string][number];
