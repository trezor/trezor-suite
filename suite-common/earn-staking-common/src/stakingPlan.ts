import { z } from 'zod';

import { stakingAmountSchema } from './stakingAmount';
import { stakingFeeLevelsSchema } from './stakingFeeLevels';
import {
    stakingOperationOptionsSchema,
    stakingOperationSchema,
    stakingStepKindSchema,
} from './stakingOperation';
import { stakingProductIdSchema } from './stakingProductId';

export const STAKING_STEP_REVIEWS = ['app-and-device', 'device-only'] as const;

export const stakingStepReviewSchema = z.enum(STAKING_STEP_REVIEWS);

export type StakingStepReview = z.infer<typeof stakingStepReviewSchema>;

export const stakingStepSchema = z.strictObject({
    id: z.string().min(1),
    kind: stakingStepKindSchema,
    awaitConfirmation: z.boolean(),
    review: stakingStepReviewSchema,
    payload: z.unknown(),
});

export type StakingStep = z.infer<typeof stakingStepSchema>;

export const stakingPlanSchema = z.strictObject({
    productId: stakingProductIdSchema,
    operation: stakingOperationSchema,
    amount: stakingAmountSchema.nullable(),
    options: stakingOperationOptionsSchema,
    steps: z.array(stakingStepSchema).min(1).readonly(),
});

export type StakingPlan = z.infer<typeof stakingPlanSchema>;

export const stakingStepOutputSchema = z.strictObject({
    address: z.string().min(1),
    amount: stakingAmountSchema,
});

export type StakingStepOutput = z.infer<typeof stakingStepOutputSchema>;

export const composedStakingStepSchema = z.strictObject({
    feeLevels: stakingFeeLevelsSchema,
    outputs: z.array(stakingStepOutputSchema).readonly(),
    unsignedTx: z.unknown(),
    validityMs: z.number().int().positive().nullable(),
});

export type ComposedStakingStep = z.infer<typeof composedStakingStepSchema>;

export const signedStakingStepSchema = z.strictObject({
    serializedTx: z.string().min(1),
});

export type SignedStakingStep = z.infer<typeof signedStakingStepSchema>;
