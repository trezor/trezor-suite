import { z } from '@trezor/zod';

/** What the active worker reports about its build. A worker from an older deploy may answer differently. */
export const ServiceWorkerBuildInfoSchema = z.object({
    version: z.string().optional(),
    commit: z.string().optional(),
    precachedEntryCount: z.number(),
    isCachingEnabled: z.boolean(),
});

export type ServiceWorkerBuildInfo = z.infer<typeof ServiceWorkerBuildInfoSchema>;
