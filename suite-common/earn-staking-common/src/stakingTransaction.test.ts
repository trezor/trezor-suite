import { mockStakingTransaction } from '../mocks';
import { isPendingStakingTransaction } from './stakingTransaction';

describe('isPendingStakingTransaction', () => {
    it.each([
        { name: 'a mined transaction', overrides: {}, expected: false },
        {
            name: 'a transaction without a block',
            overrides: { blockHeight: undefined },
            expected: true,
        },
        { name: 'a transaction at block zero', overrides: { blockHeight: 0 }, expected: true },
        {
            name: 'a transaction at a negative block',
            overrides: { blockHeight: -1 },
            expected: true,
        },
        {
            name: 'a Solana transaction the backend confirmed without a block',
            overrides: { blockHeight: undefined, solanaSpecific: { status: 'confirmed' as const } },
            expected: false,
        },
        {
            name: 'a pending Solana transaction',
            overrides: { blockHeight: 0, solanaSpecific: { status: 'pending' as const } },
            expected: true,
        },
    ])('reports $name', ({ overrides, expected }) => {
        expect(isPendingStakingTransaction(mockStakingTransaction(overrides))).toBe(expected);
    });
});
