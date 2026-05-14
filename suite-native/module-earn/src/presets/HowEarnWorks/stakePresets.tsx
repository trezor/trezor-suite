import { Translation } from '@suite-native/intl';

import { type HowEarnWorksScreenPreset } from './types';

type CreateHowStakeWorksPresetProps = {
    displaySymbol: string;
    potentialRewards: string;
    entryPeriodInDays: number | undefined;
    unstakingPeriodInDays: number | undefined;
    apy: number | null | undefined;
};

export const createHowStakeWorksPreset = ({
    displaySymbol,
    potentialRewards,
    entryPeriodInDays,
    unstakingPeriodInDays,
    apy,
}: CreateHowStakeWorksPresetProps): HowEarnWorksScreenPreset => {
    const entryPeriodDescriptionId =
        entryPeriodInDays !== undefined
            ? 'earn.howStakeWorksScreen.stakingTimeline.second.description'
            : 'earn.notAvailable';
    const stakingRewardsDescriptionId =
        apy != null
            ? 'earn.howStakeWorksScreen.stakingTimeline.third.description'
            : 'earn.notAvailableShort';
    const unstakingPeriodDescriptionId =
        unstakingPeriodInDays !== undefined
            ? 'earn.howStakeWorksScreen.unstakeTimeline.second.description'
            : 'earn.notAvailable';

    return {
        benefitItems: [
            {
                id: 'stake-benefit-rewards',
                icon: 'piggyBank',
                title: (
                    <Translation
                        id="earn.howStakeWorksScreen.benefits.first.title"
                        values={{ displaySymbol, potentialRewards }}
                    />
                ),
                description: (
                    <Translation
                        id="earn.howStakeWorksScreen.benefits.first.description"
                        values={{ displaySymbol }}
                    />
                ),
            },
            {
                id: 'stake-benefit-compound',
                icon: 'trendUp',
                title: <Translation id="earn.howStakeWorksScreen.benefits.second.title" />,
                description: (
                    <Translation id="earn.howStakeWorksScreen.benefits.second.description" />
                ),
            },
            {
                id: 'stake-benefit-growth',
                icon: 'clock',
                title: (
                    <Translation
                        id="earn.howStakeWorksScreen.benefits.third.title"
                        values={{ displaySymbol }}
                    />
                ),
                description: (
                    <Translation id="earn.howStakeWorksScreen.benefits.third.description" />
                ),
            },
        ],
        timelineSections: [
            {
                id: 'staking',
                title: <Translation id="earn.howStakeWorksScreen.stakingTimelineTitle" />,
                iconName: 'arrowUpRight',
                items: [
                    {
                        id: 'staking.first',
                        title: (
                            <Translation id="earn.howStakeWorksScreen.stakingTimeline.first.title" />
                        ),
                        description: (
                            <Translation id="earn.howStakeWorksScreen.stakingTimeline.first.description" />
                        ),
                    },
                    {
                        id: 'staking.second',
                        title: (
                            <Translation id="earn.howStakeWorksScreen.stakingTimeline.second.title" />
                        ),
                        description: (
                            <Translation
                                id={entryPeriodDescriptionId}
                                values={{ entryPeriod: entryPeriodInDays }}
                            />
                        ),
                    },
                    {
                        id: 'staking.third',
                        title: (
                            <Translation id="earn.howStakeWorksScreen.stakingTimeline.third.title" />
                        ),
                        description: (
                            <Translation id={stakingRewardsDescriptionId} values={{ apy }} />
                        ),
                    },
                ],
            },
            {
                id: 'unstake',
                title: <Translation id="earn.howStakeWorksScreen.unstakeTimelineTitle" />,
                iconName: 'arrowDownLeft',
                items: [
                    {
                        id: 'unstake.first',
                        title: (
                            <Translation id="earn.howStakeWorksScreen.unstakeTimeline.first.title" />
                        ),
                        description: (
                            <Translation id="earn.howStakeWorksScreen.unstakeTimeline.first.description" />
                        ),
                    },
                    {
                        id: 'unstake.second',
                        title: (
                            <Translation id="earn.howStakeWorksScreen.unstakeTimeline.second.title" />
                        ),
                        description: (
                            <Translation
                                id={unstakingPeriodDescriptionId}
                                values={{ unstakingPeriod: unstakingPeriodInDays }}
                            />
                        ),
                    },
                    {
                        id: 'unstake.third',
                        title: (
                            <Translation
                                id="earn.howStakeWorksScreen.unstakeTimeline.third.title"
                                values={{ symbol: displaySymbol }}
                            />
                        ),
                        description: (
                            <Translation id="earn.howStakeWorksScreen.unstakeTimeline.third.description" />
                        ),
                    },
                    {
                        id: 'unstake.fourth',
                        title: (
                            <Translation
                                id="earn.howStakeWorksScreen.unstakeTimeline.fourth.title"
                                values={{ symbol: displaySymbol }}
                            />
                        ),
                        description: (
                            <Translation id="earn.howStakeWorksScreen.unstakeTimeline.fourth.description" />
                        ),
                    },
                ],
            },
        ],
    };
};
