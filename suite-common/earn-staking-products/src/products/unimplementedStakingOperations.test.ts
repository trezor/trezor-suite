import {
    STAKING_OPERATION_ERROR_CODES,
    StakingAdapterError,
} from '@suite-common/earn-staking-common';
import {
    mockComposedStakingStep,
    mockSignedStakingStep,
    mockStakingAccount,
    mockStakingPlan,
    mockStakingStep,
} from '@suite-common/earn-staking-common/mocks';

import { createUnimplementedStakingOperations } from './unimplementedStakingOperations';

const account = mockStakingAccount();
const plan = mockStakingPlan();
const step = mockStakingStep();

describe('createUnimplementedStakingOperations', () => {
    const operations = createUnimplementedStakingOperations();

    it.each([
        {
            name: 'planOperation',
            call: () =>
                operations.planOperation({
                    account,
                    position: null,
                    operation: 'stake',
                    options: {},
                    amount: null,
                }),
        },
        {
            name: 'composeStep',
            call: () => operations.composeStep({ account, plan, step, customFee: null }),
        },
        {
            name: 'signStep',
            call: () =>
                operations.signStep({
                    account,
                    plan,
                    step,
                    composedStep: mockComposedStakingStep(),
                    feeLevel: 'normal',
                }),
        },
        {
            name: 'broadcastStep',
            call: () =>
                operations.broadcastStep({
                    account,
                    plan,
                    step,
                    signedStep: mockSignedStakingStep(),
                }),
        },
    ])('rejects $name with the not-implemented code', async ({ call }) => {
        await expect(call()).rejects.toEqual(
            new StakingAdapterError(STAKING_OPERATION_ERROR_CODES.notImplemented),
        );
    });
});
