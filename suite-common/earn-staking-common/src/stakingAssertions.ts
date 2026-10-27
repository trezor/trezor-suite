import { z } from 'zod';

import { type StakingPlan, stakingPlanSchema } from './stakingPlan';
import { type StakingPosition, stakingPositionSchema } from './stakingPosition';

const isStakingValidationEnabled = process.env.NODE_ENV !== 'production';

const assertMatches = (schema: z.ZodType, value: unknown, subject: string): void => {
    if (!isStakingValidationEnabled) return;

    const result = schema.safeParse(value);

    if (!result.success) {
        throw new Error(`${subject} is invalid:\n${z.prettifyError(result.error)}`);
    }
};

export const assertStakingPosition = (position: StakingPosition): void =>
    assertMatches(stakingPositionSchema, position, 'Staking position');

export const assertStakingPlan = (plan: StakingPlan): void =>
    assertMatches(stakingPlanSchema, plan, 'Staking plan');
