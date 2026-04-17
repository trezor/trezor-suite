import { type Account } from '@suite-common/wallet-types';
import {
    formatNetworkAmount,
    getAccountTotalStakingBalance,
    getStakingLimitsByNetworkSymbol,
} from '@suite-common/wallet-utils';
import { type StakingNavigateFrom } from '@suite-native/analytics';
import { BigNumber } from '@trezor/utils';

export const getStakingAnalyticsNavigateFrom = (
    account: Account,
): StakingNavigateFrom | undefined => {
    const limits = getStakingLimitsByNetworkSymbol(account.symbol);

    if (!limits) return undefined;

    const stakedBalance = getAccountTotalStakingBalance(account);
    const hasStakedBalance = !!stakedBalance && new BigNumber(stakedBalance).gt(0);
    const formattedAvailableBalance = formatNetworkAmount(account.availableBalance, account.symbol);
    const hasEnoughBalanceForStaking = new BigNumber(formattedAvailableBalance).gte(
        limits.MIN_AMOUNT_FOR_STAKING,
    );

    if (hasStakedBalance) {
        if (new BigNumber(formattedAvailableBalance).isZero()) {
            return 'earn/staking-max';
        }

        if (!hasEnoughBalanceForStaking) {
            return 'earn/staked-but-insufficient-funds';
        }

        return 'earn/staking-active';
    }

    return hasEnoughBalanceForStaking ? 'earn/staking-inactive' : 'earn/insufficient-funds';
};
