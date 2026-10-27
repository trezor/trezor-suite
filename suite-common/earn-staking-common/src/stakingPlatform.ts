import { z } from 'zod';

import { stakingOperationSchema } from './stakingOperation';

export const STAKING_PLATFORMS = ['desktop', 'mobile'] as const;

export const stakingPlatformSchema = z.enum(STAKING_PLATFORMS);

export type StakingPlatform = z.infer<typeof stakingPlatformSchema>;

export const stakingPlatformSupportSchema = z.discriminatedUnion('access', [
    z.strictObject({
        access: z.literal('manage'),
        operations: z.array(stakingOperationSchema).readonly().optional(),
    }),
    z.strictObject({ access: z.literal('read-only') }),
    z.strictObject({ access: z.literal('listed') }),
    z.strictObject({ access: z.literal('hidden') }),
]);

export type StakingPlatformSupport = z.infer<typeof stakingPlatformSupportSchema>;

export type StakingProductAccess = StakingPlatformSupport['access'];

export const stakingProductPlatformsSchema = z.record(
    stakingPlatformSchema,
    stakingPlatformSupportSchema,
);

export type StakingProductPlatforms = z.infer<typeof stakingProductPlatformsSchema>;
