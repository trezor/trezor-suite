import { CARDANO_STAKING_REGISTRATION_DEPOSIT } from '@suite-common/wallet-constants';
import { type Account, type StakeType } from '@suite-common/wallet-types';
import {
    calculateRewards,
    formatNetworkAmount,
    getStakingDataForNetwork,
} from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';

import { getEthereumStakingAddressByType } from './ethereumStaking';
import { type StakingTotalRewards } from '../types';

export const calculateGains = (amount: string, apy: number | null, days: number) => {
    const rewards = calculateRewards(amount, apy, days);

    return new BigNumber(rewards).toFixed(5, 1);
};

export const getNetworkAdjustedStakingBalance = (amount: string, account?: Account) => {
    if (account?.networkType === 'cardano') {
        const adjusted = new BigNumber(amount).minus(CARDANO_STAKING_REGISTRATION_DEPOSIT);

        return BigNumber.max(adjusted, 0).toString();
    }

    return amount;
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
        case 'cardano':
            return {
                totalRewards: restakedReward,
                isTotalRewardsLoading: false,
            };
        default:
            return {};
    }
};
