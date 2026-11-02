import { z } from 'zod';

export const STAKING_OPERATIONS = [
    'stake',
    'unstake',
    'withdraw',
    'claim',
    'vote',
    'redelegate',
] as const;

export const stakingOperationSchema = z.enum(STAKING_OPERATIONS);

export type StakingOperation = z.infer<typeof stakingOperationSchema>;

export const STAKING_STEP_KINDS = [
    'stake',
    'unstake',
    'withdraw',
    'claim',
    'freeze',
    'vote',
    'delegate',
    'deregister',
] as const;

export const stakingStepKindSchema = z.enum(STAKING_STEP_KINDS);

export type StakingStepKind = z.infer<typeof stakingStepKindSchema>;

export const stakingOptionValueSchema = z.union([
    z.boolean(),
    z.number(),
    z.string(),
    z.array(z.string()).readonly(),
]);

export type StakingOptionValue = z.infer<typeof stakingOptionValueSchema>;

export const stakingOperationOptionsSchema = z.record(z.string(), stakingOptionValueSchema);

export type StakingOperationOptions = z.infer<typeof stakingOperationOptionsSchema>;
