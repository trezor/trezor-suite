import { z } from 'zod';

import { stakingAmountSchema } from './stakingAmount';
import {
    stakingOperationOptionsSchema,
    stakingOperationSchema,
    stakingStepKindSchema,
} from './stakingOperation';
import { stakingProductIdSchema } from './stakingProductId';

export const STAKING_STEP_REVIEWS = ['app-and-device', 'device-only'] as const;

export const stakingStepReviewSchema = z.enum(STAKING_STEP_REVIEWS);

export type StakingStepReview = z.infer<typeof stakingStepReviewSchema>;

export const stakingStepSchema = z.object({
    id: z.string().min(1),
    kind: stakingStepKindSchema,
    awaitConfirmation: z.boolean(),
    review: stakingStepReviewSchema,
    payload: z.unknown(),
});

export type StakingStep = z.infer<typeof stakingStepSchema>;

export const stakingPlanSchema = z.object({
    productId: stakingProductIdSchema,
    operation: stakingOperationSchema,
    amount: stakingAmountSchema.nullable(),
    options: stakingOperationOptionsSchema,
    steps: z.array(stakingStepSchema).min(1).readonly(),
});

export type StakingPlan = z.infer<typeof stakingPlanSchema>;

export type ComposedStakingStep = {
    feeLevels: unknown;
    unsignedTx: unknown;
    expiresAt: number | null;
};

export type SignedStakingStep = {
    serializedTx: string;
};
