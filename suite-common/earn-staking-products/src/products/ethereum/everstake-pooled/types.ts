import { stakingAmountSchema } from '@suite-common/earn-staking-common';
import { z } from '@trezor/zod';

export const everstakePoolSchema = z.object({
    name: z.string().min(1),
    autocompoundBalance: stakingAmountSchema,
    pendingBalance: stakingAmountSchema,
    pendingDepositedBalance: stakingAmountSchema,
    withdrawTotalAmount: stakingAmountSchema,
    claimableAmount: stakingAmountSchema,
    restakedReward: stakingAmountSchema,
});

export type EverstakePool = z.infer<typeof everstakePoolSchema>;
