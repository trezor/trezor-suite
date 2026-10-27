import { mockStakingProductDescriptor } from './mockStakingProductDescriptor';
import { type StakingPosition, stakingAmountSchema, stakingProviderIdSchema } from '../src';

export const mockStakingPosition = (overrides: Partial<StakingPosition> = {}): StakingPosition => ({
    productId: mockStakingProductDescriptor().id,
    status: 'active',
    lockup: 'locked',
    balances: {
        staked: stakingAmountSchema.parse('2000000000000000000'),
        pending: stakingAmountSchema.parse('0'),
        unstaking: stakingAmountSchema.parse('500000000000000000'),
        withdrawable: stakingAmountSchema.parse('0'),
        rewards: stakingAmountSchema.parse('12000000000000000'),
    },
    unlocks: [
        {
            amount: stakingAmountSchema.parse('500000000000000000'),
            availableAt: 1_777_000_000_000,
        },
    ],
    targets: [
        {
            address: '0xD523794C879D9eC028960a231F866758e405bE34',
            providerId: stakingProviderIdSchema.parse('everstake'),
            name: 'Everstake',
            amount: stakingAmountSchema.parse('2000000000000000000'),
        },
    ],
    operations: ['stake', 'unstake'],
    pendingTxids: [],
    warnings: [],
    ...overrides,
});
