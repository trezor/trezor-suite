import {
    type StakingErrorFeeLevel,
    type StakingFeeLevels,
    type StakingFinalFeeLevel,
    stakingAmountSchema,
} from '../src';

export const mockStakingFinalFeeLevel = (
    overrides: Partial<StakingFinalFeeLevel> = {},
): StakingFinalFeeLevel => ({
    type: 'final',
    fee: stakingAmountSchema.parse('462000000000000'),
    totalSpent: stakingAmountSchema.parse('1000462000000000000'),
    feePerUnit: '2.1',
    feeLimit: '220000',
    max: null,
    extras: { estimatedFeeLimit: '220000' },
    ...overrides,
});

export const mockStakingErrorFeeLevel = (
    overrides: Partial<StakingErrorFeeLevel> = {},
): StakingErrorFeeLevel => ({
    type: 'error',
    error: 'AMOUNT_NOT_ENOUGH_CURRENCY_FEE',
    errorMessage: {
        id: 'AMOUNT_NOT_ENOUGH_CURRENCY_FEE',
        values: { networkDisplaySymbol: 'ETH' },
    },
    ...overrides,
});

export const mockStakingFeeLevels = (overrides: StakingFeeLevels = {}): StakingFeeLevels => ({
    economy: mockStakingFinalFeeLevel({
        fee: stakingAmountSchema.parse('220000000000000'),
        totalSpent: stakingAmountSchema.parse('1000220000000000000'),
        feePerUnit: '1',
    }),
    normal: mockStakingFinalFeeLevel(),
    high: mockStakingFinalFeeLevel({
        fee: stakingAmountSchema.parse('660000000000000'),
        totalSpent: stakingAmountSchema.parse('1000660000000000000'),
        feePerUnit: '3',
    }),
    ...overrides,
});
