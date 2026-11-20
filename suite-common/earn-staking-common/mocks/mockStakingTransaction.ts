import type { StakingTransaction } from '../src';

export const mockStakingTransaction = (
    overrides: Partial<StakingTransaction> = {},
): StakingTransaction => ({
    txid: '0x9f1c5d4c2a4e3f7b6c8d9e0f1a2b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d',
    type: 'sent',
    blockHeight: 21_000_000,
    blockTime: 1_777_000_000,
    ...overrides,
});
