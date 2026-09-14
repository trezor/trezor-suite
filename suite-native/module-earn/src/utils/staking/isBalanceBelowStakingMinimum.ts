import { type NetworkConfigDeps } from '@suite-common/networks';
import { getStakingLimitsByNetworkSymbol } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { formatNetworkAmount } from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';

export const isBalanceBelowStakingMinimum = (
    networkConfigDeps: NetworkConfigDeps,
    account: Account,
): boolean => {
    const limits = getStakingLimitsByNetworkSymbol(networkConfigDeps, account.symbol);

    if (!limits) {
        return false;
    }

    const formattedBalance = formatNetworkAmount(
        networkConfigDeps,
        account.availableBalance,
        account.symbol,
    );
    const minBalanceForStaking = limits.MIN_AMOUNT_FOR_STAKING.plus(
        limits.MIN_BALANCE_FOR_FEE_BUFFER,
    );

    return new BigNumber(formattedBalance).lt(minBalanceForStaking);
};
