import { TimelineDetailsCard } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

type HowStakeWorksStakingTimelineProps = {
    entryPeriodInDays?: number;
    apy?: number | null;
};

export const HowStakeWorksStakingTimeline = ({
    entryPeriodInDays,
    apy,
}: HowStakeWorksStakingTimelineProps) => (
    <TimelineDetailsCard
        headerTitle={<Translation id="earn.howStakeWorksScreen.stakingTimelineTitle" />}
        headerIconName="arrowUpRight"
        items={[
            {
                id: 'staking.first',
                title: <Translation id="earn.howStakeWorksScreen.stakingTimeline.first.title" />,
                description: (
                    <Translation id="earn.howStakeWorksScreen.stakingTimeline.first.description" />
                ),
            },
            {
                id: 'staking.second',
                title: <Translation id="earn.howStakeWorksScreen.stakingTimeline.second.title" />,
                description:
                    entryPeriodInDays !== undefined ? (
                        <Translation
                            id="earn.howStakeWorksScreen.stakingTimeline.second.description"
                            values={{ entryPeriod: entryPeriodInDays }}
                        />
                    ) : (
                        <Translation id="earn.notAvailable" />
                    ),
            },
            {
                id: 'staking.third',
                title: <Translation id="earn.howStakeWorksScreen.stakingTimeline.third.title" />,
                description:
                    apy != null ? (
                        <Translation
                            id="earn.howStakeWorksScreen.stakingTimeline.third.description"
                            values={{ apy }}
                        />
                    ) : (
                        <Translation id="earn.notAvailableShort" />
                    ),
            },
        ]}
    />
);
