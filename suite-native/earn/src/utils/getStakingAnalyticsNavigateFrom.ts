import { getStakingLimitsByNetworkSymbol } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { formatNetworkAmount, getAccountTotalStakingBalance } from '@suite-common/wallet-utils';
import { type StakingNavigateFrom } from '@suite-native/analytics';
import { BigNumber } from '@trezor/utils';

export const getStakingAnalyticsNavigateFrom = (account: Account): StakingNavigateFrom => {
    const limits = getStakingLimitsByNetworkSymbol(account.symbol);

    if (!limits) return 'unknown';

    const stakedBalance = getAccountTotalStakingBalance(account);
    const hasStakedBalance = !!stakedBalance && new BigNumber(stakedBalance).gt(0);
    const formattedAvailableBalance = formatNetworkAmount(account.availableBalance, account.symbol);
    const hasEnoughBalanceForStaking = new BigNumber(formattedAvailableBalance).gte(
        limits.MIN_AMOUNT_FOR_STAKING,
    );

    if (hasStakedBalance) {
        if (new BigNumber(formattedAvailableBalance).isZero()) {
            return 'dashboard/staking-dashboard/staking-max';
        }

        if (!hasEnoughBalanceForStaking) {
            return 'dashboard/staking-dashboard/staked-but-insufficient-funds';
        }

        return 'dashboard/staking-dashboard/staking-active';
    }

    return hasEnoughBalanceForStaking
        ? 'dashboard/staking-dashboard/staking-inactive'
        : 'dashboard/staking-dashboard/insufficient-funds';
};
