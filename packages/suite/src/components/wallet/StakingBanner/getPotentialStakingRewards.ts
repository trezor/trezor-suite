import {
    calculateRewards,
    getNetworkAdjustedStakingBalance,
    getStakingDataForNetwork,
    getStakingLimitsByNetworkSymbol,
} from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { BigNumber } from '@trezor/utils';

export const getPotentialStakingRewards = (
    accounts: readonly Account[],
    rate: number | null,
): BigNumber =>
    accounts.reduce((total, account) => {
        const stakingLimits = getStakingLimitsByNetworkSymbol(account.symbol);

        if (
            stakingLimits === null ||
            new BigNumber(account.formattedBalance).lt(stakingLimits.MIN_AMOUNT_FOR_STAKING)
        ) {
            return total;
        }

        const stakingBalance = getStakingDataForNetwork(account)?.depositedBalance || '0';
        const balance = new BigNumber(stakingBalance).plus(account.formattedBalance).toString();

        return total.plus(
            calculateRewards(getNetworkAdjustedStakingBalance(balance, account), rate),
        );
    }, new BigNumber(0));
