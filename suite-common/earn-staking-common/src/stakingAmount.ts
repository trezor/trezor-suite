import { z } from 'zod';

const STAKING_AMOUNT_PATTERN = /^\d+$/;

export const stakingAmountSchema = z
    .string()
    .regex(STAKING_AMOUNT_PATTERN, 'Expected a decimal amount in base units')
    .brand<'StakingAmount'>();

export type StakingAmount = z.infer<typeof stakingAmountSchema>;
