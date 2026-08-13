import { type NetworkSymbol, getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { Translation } from '@suite-native/intl';
import { SOLANA_EPOCH_DAYS } from '@trezor/network-solana/constants';

import { type HowEarnWorksScreenPreset } from './types';

type CreateHowStakeWorksPresetProps = {
    symbol: NetworkSymbol;
    entryPeriodInDays: number | undefined;
    unstakingPeriodInDays: number | undefined;
    apy: number | null | undefined;
};

export const createHowStakeWorksPreset = ({
    symbol,
    entryPeriodInDays,
    unstakingPeriodInDays,
    apy,
}: CreateHowStakeWorksPresetProps): HowEarnWorksScreenPreset => {
    const displaySymbol = getNetworkDisplaySymbol(symbol);
    const isSolana = symbol === 'sol';

    const entryPeriodDescriptionId =
        entryPeriodInDays !== undefined
            ? 'earn.howStakeWorksScreen.stakingTimeline.second.description'
            : 'earn.notAvailable';
    const stakingPeriodTitleId = isSolana
        ? 'earn.howStakeWorksScreen.stakingTimeline.second.title.solana'
        : 'earn.howStakeWorksScreen.stakingTimeline.second.title.ethereum';
    const stakingRewardsTitleId = isSolana
        ? 'earn.howStakeWorksScreen.stakingTimeline.third.title.solana'
        : 'earn.howStakeWorksScreen.stakingTimeline.third.title.ethereum';
    const stakingRewardsDescriptionId =
        apy != null
            ? 'earn.howStakeWorksScreen.stakingTimeline.third.description'
            : 'earn.notAvailableShort';
    const unstakingPeriodTitleId = isSolana
        ? 'earn.howStakeWorksScreen.unstakeTimeline.second.title.solana'
        : 'earn.howStakeWorksScreen.unstakeTimeline.second.title.ethereum';
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
                        values={{ apy }}
                    />
                ),
                description: (
                    <Translation id="earn.howStakeWorksScreen.benefits.first.description" />
                ),
            },
            {
                id: 'stake-benefit-compound',
                icon: 'trendUp',
                title: (
                    <Translation
                        id="earn.howStakeWorksScreen.benefits.second.title"
                        values={{ displaySymbol }}
                    />
                ),
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
                        values={{ days: unstakingPeriodInDays }}
                    />
                ),
                description: (
                    <Translation
                        id={
                            symbol === 'eth'
                                ? 'earn.howStakeWorksScreen.benefits.third.description.ethereum'
                                : 'earn.howStakeWorksScreen.benefits.third.description.solana'
                        }
                        values={{ days: unstakingPeriodInDays }}
                    />
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
                        title: <Translation id={stakingPeriodTitleId} />,
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
                            <Translation
                                id={stakingRewardsTitleId}
                                values={{ days: SOLANA_EPOCH_DAYS }}
                            />
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
                        title: <Translation id={unstakingPeriodTitleId} />,
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
