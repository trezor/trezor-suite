import { mockStakingProductDescriptor } from './mockStakingProductDescriptor';
import { type StakingPosition, asStakingAmount, asStakingProviderId } from '../src';

export const mockStakingPosition = (overrides: Partial<StakingPosition> = {}): StakingPosition => ({
    productId: mockStakingProductDescriptor().id,
    status: 'active',
    lockup: 'locked',
    balances: {
        staked: asStakingAmount('2000000000000000000'),
        pending: asStakingAmount('0'),
        unstaking: asStakingAmount('500000000000000000'),
        withdrawable: asStakingAmount('0'),
        rewards: asStakingAmount('12000000000000000'),
    },
    unlocks: [
        {
            amount: asStakingAmount('500000000000000000'),
            availableAt: 1_777_000_000_000,
        },
    ],
    targets: [
        {
            address: '0xD523794C879D9eC028960a231F866758e405bE34',
            providerId: asStakingProviderId('everstake'),
            name: 'Everstake',
            amount: asStakingAmount('2000000000000000000'),
        },
    ],
    operations: ['stake', 'unstake'],
    pendingTxids: [],
    warnings: [],
    ...overrides,
});
