import { z } from 'zod';

export const cardanoDrepInfoSchema = z.object({
    drep_id: z.string(),
    hex: z.string(),
    amount: z.string(),
    active: z.boolean(),
    active_epoch: z.number().nullable(),
    has_script: z.boolean(),
});

export type CardanoDrepInfo = z.output<typeof cardanoDrepInfoSchema>;

export const cardanoStakingInfoSchema = z.object({
    address: z.string(),
    isActive: z.boolean(),
    rewards: z.string(),
    poolId: z.string().nullable(),
    drep: cardanoDrepInfoSchema.nullable().default(null),
});

export type CardanoStakingInfo = z.output<typeof cardanoStakingInfoSchema>;

export const NON_DELEGATED_CARDANO_STAKING_INFO: CardanoStakingInfo = {
    address: '',
    isActive: false,
    rewards: '0',
    poolId: null,
    drep: null,
};
