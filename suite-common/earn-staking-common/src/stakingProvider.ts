import { z } from 'zod';

import { networkSymbolSchema } from './primitiveSchemas';

const STAKING_PROVIDER_ID_PATTERN = /^[a-z0-9][a-z0-9.-]*$/;

export const stakingProviderIdSchema = z
    .string()
    .regex(STAKING_PROVIDER_ID_PATTERN, 'Expected a lowercase provider id')
    .brand<'StakingProviderId'>();

export type StakingProviderId = z.infer<typeof stakingProviderIdSchema>;

export const asStakingProviderId = (value: string) => value as StakingProviderId;

export const stakingProviderLinksSchema = z.object({
    website: z.url(),
    terms: z.url().optional(),
});

export type StakingProviderLinks = z.infer<typeof stakingProviderLinksSchema>;

const stakingProviderBaseSchema = z.object({
    id: stakingProviderIdSchema,
    name: z.string().min(1),
    identities: z.partialRecord(networkSymbolSchema, z.array(z.string()).readonly()),
});

export const stakingProviderSchema = z.discriminatedUnion('status', [
    stakingProviderBaseSchema.extend({
        status: z.literal('active'),
        links: stakingProviderLinksSchema,
    }),
    stakingProviderBaseSchema.extend({
        status: z.literal('retired'),
        links: stakingProviderLinksSchema,
    }),
    stakingProviderBaseSchema.extend({
        status: z.literal('curated'),
        links: stakingProviderLinksSchema,
    }),
    stakingProviderBaseSchema.extend({ status: z.literal('external') }),
]);

export type StakingProvider = z.infer<typeof stakingProviderSchema>;

export type StakingProviderStatus = StakingProvider['status'];
