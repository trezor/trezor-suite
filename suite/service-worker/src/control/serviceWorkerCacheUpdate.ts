import { z } from '@trezor/zod';

/**
 * What Serwist's `BroadcastUpdatePlugin` sends to every tab once the worker has stored a newer copy
 * of a file it served from its cache.
 */
export const ServiceWorkerCacheUpdateMessageSchema = z.object({
    type: z.literal('CACHE_UPDATED'),
    meta: z.literal('serwist-broadcast-update'),
    payload: z.object({ cacheName: z.string(), updatedURL: z.string() }),
});
