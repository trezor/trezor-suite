import { Account, StakeType, Timestamp } from '@suite-common/wallet-types';
import { formatNetworkAmount, getStakingDataForNetwork } from '@suite-common/wallet-utils';
import { BigNumber } from '@trezor/utils';

import { TranslationFunction } from 'src/hooks/suite/useTranslation';

import { getEthereumStakingAddressByType } from './ethereumStaking';

interface ValidateMaxOptions {
    maxAmount: BigNumber;
    except?: boolean;
}

export const validateStakingMax =
    (translationString: TranslationFunction, { except, maxAmount }: ValidateMaxOptions) =>
    (value: string) => {
        if (!except && value && BigNumber(value).gt(maxAmount)) {
            return translationString('AMOUNT_EXCEEDS_MAX', {
                maxAmount: maxAmount.toString(),
            });
        }
    };

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

interface StakingTotalRewards {
    data?: string;
    error?: string | boolean;
    isLoading?: boolean;
    lastSuccessfulFetchTimestamp?: Timestamp;
}

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
