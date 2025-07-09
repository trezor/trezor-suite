import { Account, StakeType } from '@suite-common/wallet-types';
import { formatNetworkAmount, getStakingDataForNetwork } from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';

import { getEthereumStakingAddressByType } from './ethereumStaking';
import { StakingTotalRewards } from '../types';

export const calculateGains = (input: string, apy: number, divisor: number) => {
    const amount = new BigNumber(input).multipliedBy(apy).dividedBy(100).dividedBy(divisor);

    return amount.toFixed(5, 1);
};

export const getStakingContractAddress = (account: Account, stakeType: StakeType) => {
    if (!account) return '';

    switch (account.networkType) {
        case 'ethereum':
            return getEthereumStakingAddressByType(account.symbol, stakeType);
        case 'solana':
        default:
            return account.descriptor;
    }
};

export const getStakingTotalRewards = (
    account?: Account,
    stakingTotalRewards?: StakingTotalRewards,
) => {
    if (!account) return {};

    const { restakedReward = '0' } = getStakingDataForNetwork(account) ?? {};

    const { data, isLoading: isSolanaTotalRewardsLoading } = stakingTotalRewards ?? {};
    const solanaTotalRewards = data ?? '0';
    const isTotalRewardsLoading = isSolanaTotalRewardsLoading || data === undefined;

    const solRewardsFormatted = formatNetworkAmount(solanaTotalRewards, account.symbol);

    switch (account.networkType) {
        case 'ethereum':
            return {
                totalRewards: restakedReward,
                isTotalRewardsLoading: false,
            };
        case 'solana':
            return {
                totalRewards: solRewardsFormatted,
                isTotalRewardsLoading,
            };
        default:
            return {};
    }
};
