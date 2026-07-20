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
