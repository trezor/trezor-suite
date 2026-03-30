import { type NetworkSymbol, getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { TimelineDetailsCard } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';

type HowStakeWorksUnstakingTimelineProps = {
    symbol: NetworkSymbol;
    unstakingPeriodInDays?: number;
};

export const HowStakeWorksUnstakingTimeline = ({
    symbol,
    unstakingPeriodInDays,
}: HowStakeWorksUnstakingTimelineProps) => {
    const displaySymbol = getNetworkDisplaySymbol(symbol);

    return (
        <TimelineDetailsCard
            headerTitle={<Translation id="earn.howStakeWorksScreen.unstakeTimelineTitle" />}
            headerIconName="arrowDownLeft"
            items={[
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
                    description:
                        unstakingPeriodInDays !== undefined ? (
                            <Translation
                                id="earn.howStakeWorksScreen.unstakeTimeline.second.description"
                                values={{ unstakingPeriod: unstakingPeriodInDays }}
                            />
                        ) : (
                            <Translation id="earn.notAvailable" />
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
            ]}
        />
    );
};
