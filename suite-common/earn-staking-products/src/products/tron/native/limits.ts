import { stakingProductLimitsSchema } from '@suite-common/earn-staking-common';

// Copied in sun from wallet-core tronStakingConstants.ts,
// so the staking packages own every staking value.
export const TRON_NATIVE_PRODUCT_LIMITS = stakingProductLimitsSchema.parse({
    minStakeAmount: '1000000',
    maxStakeAmount: '1000000000000000',
    minWithdrawalAmount: '10000',
    feeBufferBalance: '5000000',
    minBalanceForStaking: '1010000',
    minStakeAmountForDashboard: '1000000',
});
