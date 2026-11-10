// Copied from @trezor/network-solana constants/staking.ts in lamports, so the staking

import { stakingProductLimitsSchema } from '@suite-common/earn-staking-common';

// packages own every staking value; the originals stay until the legacy cleanup.
export const SOLANA_NATIVE_DELEGATION_PRODUCT_LIMITS = stakingProductLimitsSchema.parse({
    minStakeAmount: '1000000000',
    maxStakeAmount: '10000000000000000',
    minWithdrawalAmount: '20000000',
    feeBufferBalance: '5000000',
    minBalanceForStaking: '1020000000',
    minStakeAmountForDashboard: '1000000000',
});
