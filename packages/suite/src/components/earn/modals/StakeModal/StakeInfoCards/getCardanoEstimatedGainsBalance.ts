import { getStakeableBalance } from '@suite-common/earn-staking';
import { type StakingAmount, type StakingProductLimits } from '@suite-common/earn-staking-common';
import { isPositiveBalance } from '@suite-common/wallet-utils';

type GetCardanoEstimatedGainsBalanceParams = {
    staked: StakingAmount;
    availableBalance: string;
    limits: StakingProductLimits;
};

// A Cardano delegation is the whole balance. A registered key delegates its stake, reward balance
// included, and has paid the deposit; a key still to register delegates the available balance less
// the registration deposit.
export const getCardanoEstimatedGainsBalance = ({
    staked,
    availableBalance,
    limits,
}: GetCardanoEstimatedGainsBalanceParams): StakingAmount =>
    isPositiveBalance(staked) ? staked : getStakeableBalance({ availableBalance, limits });
