import {
    type StakingProductLimits,
    stakingAmountSchema,
    stakingProductLimitsSchema,
} from '@suite-common/earn-staking-common';

import {
    SMALLEST_STAKING_AMOUNT,
    ZERO_STAKING_AMOUNT,
    sumStakingAmounts,
} from '../../../utils/stakingAmounts';

// Lido takes any stake, up to a limit that refills over a day; the flow reads the live limit, so
// the static maximum is its ceiling of 150 000 ETH.
const MAX_STAKE_AMOUNT = stakingAmountSchema.parse('150000000000000000000000');
// The withdrawal queue refuses a request under 100 wei of stETH.
const MIN_WITHDRAWAL_AMOUNT = stakingAmountSchema.parse('100');
// Kept for the fee of a later withdrawal, as the Everstake product keeps it.
const FEE_BUFFER_BALANCE = stakingAmountSchema.parse('5000000000000000');
const MIN_STAKE_AMOUNT_FOR_DASHBOARD = stakingAmountSchema.parse('10000000000000000');

export const createEthereumLidoLiquidProductLimits = (): StakingProductLimits =>
    stakingProductLimitsSchema.parse({
        minStakeAmount: SMALLEST_STAKING_AMOUNT,
        maxStakeAmount: MAX_STAKE_AMOUNT,
        minWithdrawalAmount: MIN_WITHDRAWAL_AMOUNT,
        feeBufferBalance: FEE_BUFFER_BALANCE,
        minBalanceForStaking: sumStakingAmounts([SMALLEST_STAKING_AMOUNT, FEE_BUFFER_BALANCE]),
        minStakeAmountForDashboard: MIN_STAKE_AMOUNT_FOR_DASHBOARD,
        registrationDeposit: ZERO_STAKING_AMOUNT,
    });
