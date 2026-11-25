export type GetStakingNextPayoutInDaysParams = {
    nextRewardInDays: number | null;
    daysUntilActivation: number | null;
    rewardPeriodDays: number | null;
    hasStake: boolean;
};

// A deposit earns from its activation on, so its first payout is the next one on or after that
// day: a whole number of reward periods past the next payout. Without the period it has no date.
export const getStakingNextPayoutInDays = ({
    nextRewardInDays,
    daysUntilActivation,
    rewardPeriodDays,
    hasStake,
}: GetStakingNextPayoutInDaysParams): number | null => {
    if (nextRewardInDays === null) return null;
    if (hasStake) return nextRewardInDays;
    if (daysUntilActivation === null) return null;
    if (daysUntilActivation <= nextRewardInDays) return nextRewardInDays;
    if (rewardPeriodDays === null) return null;

    const periodsToWait = Math.ceil((daysUntilActivation - nextRewardInDays) / rewardPeriodDays);

    return Math.round(nextRewardInDays + periodsToWait * rewardPeriodDays);
};
