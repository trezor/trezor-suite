import { isPositiveBalance } from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';

/** The share of the total that is staked; none while either amount is nothing. */
export const getStakingRatio = (totalAmount: string | undefined, stakingAmount: string) => {
    if (
        totalAmount === undefined ||
        !isPositiveBalance(totalAmount) ||
        !isPositiveBalance(stakingAmount)
    ) {
        return undefined;
    }

    return Number(stakingAmount) / Number(totalAmount);
};

/** What is left of a total once the staked amount is taken out. */
export const subtractStakingAmount = (totalAmount: string, stakingAmount: string) =>
    new BigNumber(totalAmount).minus(stakingAmount).toFixed();

/** What is left of the total once the staked amount is taken out; none while the total is unknown. */
export const getAvailableAmount = (totalAmount: string | undefined, stakingAmount: string) =>
    totalAmount === undefined ? undefined : subtractStakingAmount(totalAmount, stakingAmount);
