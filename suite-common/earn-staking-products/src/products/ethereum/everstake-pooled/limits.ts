import {
    type StakingProductLimits,
    stakingAmountSchema,
    stakingProductLimitsSchema,
} from '@suite-common/earn-staking-common';

import { type EverstakePoolDeployment } from './deployments';
import { ZERO_STAKING_AMOUNT, sumStakingAmounts } from '../../../utils/stakingAmounts';

// Copied from wallet-core's ethereumStakingConstants.ts and wallet-constants, in wei, so the
// staking packages own every staking value; the originals stay until the legacy cleanup.
const MAX_STAKE_AMOUNT = stakingAmountSchema.parse('1000000000000000000000000');
const MIN_WITHDRAWAL_AMOUNT = stakingAmountSchema.parse('5000000000000000');
const FEE_BUFFER_BALANCE = stakingAmountSchema.parse('5000000000000000');

export const createEthereumEverstakePooledProductLimits = ({
    minStakeAmount,
}: EverstakePoolDeployment): StakingProductLimits =>
    stakingProductLimitsSchema.parse({
        minStakeAmount,
        maxStakeAmount: MAX_STAKE_AMOUNT,
        minWithdrawalAmount: MIN_WITHDRAWAL_AMOUNT,
        feeBufferBalance: FEE_BUFFER_BALANCE,
        minBalanceForStaking: sumStakingAmounts([minStakeAmount, MIN_WITHDRAWAL_AMOUNT]),
        minStakeAmountForDashboard: minStakeAmount,
        registrationDeposit: ZERO_STAKING_AMOUNT,
    });
