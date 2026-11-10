import { stakingProductLimitsSchema } from '@suite-common/earn-staking-common';

export const CARDANO_FIVEBINARIES_RETIRED_PRODUCT_LIMITS = stakingProductLimitsSchema.parse({
    minStakeAmount: '0',
    maxStakeAmount: '0',
    minWithdrawalAmount: '0',
    feeBufferBalance: '0',
    minBalanceForStaking: '0',
    minStakeAmountForDashboard: '0',
});
