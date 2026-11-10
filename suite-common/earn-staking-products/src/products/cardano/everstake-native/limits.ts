import { stakingProductLimitsSchema } from '@suite-common/earn-staking-common';

// Copied in lovelace from wallet-core cardanoStakingConstants.ts and the registration
// deposit in wallet-constants, so the staking packages own every staking value.
export const CARDANO_EVERSTAKE_NATIVE_PRODUCT_LIMITS = stakingProductLimitsSchema.parse({
    minStakeAmount: '0',
    maxStakeAmount: '72000000000000',
    minWithdrawalAmount: '0',
    feeBufferBalance: '0',
    minBalanceForStaking: '0',
    minStakeAmountForDashboard: '2000000',
});
