// Copied from wallet-core's ethereumStakingConstants.ts and wallet-constants, in wei, so the

import { stakingProductLimitsSchema } from '@suite-common/earn-staking-common';

// staking packages own every staking value; the originals stay until the legacy cleanup.
export const ETHEREUM_EVERSTAKE_POOLED_PRODUCT_LIMITS = stakingProductLimitsSchema.parse({
    minStakeAmount: '10000000000000000',
    maxStakeAmount: '1000000000000000000000000',
    minWithdrawalAmount: '5000000000000000',
    feeBufferBalance: '5000000000000000',
    minBalanceForStaking: '15000000000000000',
    minStakeAmountForDashboard: '10000000000000000',
});
