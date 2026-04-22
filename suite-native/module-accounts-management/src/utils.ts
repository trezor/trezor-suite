import { type RewardDto, type RewardDtoYieldSource } from '@suite-common/earn-stablecoin-api';
import { type TxKeyPath } from '@suite-native/intl';

export const sortApyRewards = (rewards: RewardDto[]) =>
    rewards.toSorted((rewardA, rewardB) => {
        if (rewardA.yieldSource === 'vault') {
            return -1;
        }

        if (rewardB.yieldSource === 'vault') {
            return 1;
        }

        return rewardB.rate - rewardA.rate;
    });

export const getApyBreakdownDescriptionKey = (
    yieldSource: RewardDtoYieldSource,
): TxKeyPath | null => {
    switch (yieldSource) {
        case 'vault':
        case 'lending_interest':
            return 'moduleAccounts.accountDetail.stablecoinYield.apyBreakdown.autoCompounded';
        case 'protocol_incentive':
        case 'points':
            return 'moduleAccounts.accountDetail.stablecoinYield.apyBreakdown.manualCompound';
        default:
            return null;
    }
};
