import { type StakingRateKind } from '@suite-common/earn-staking-common';
import { type NetworkSymbol, getNetworkType } from '@suite-common/wallet-config';
import { isApyAvailable } from '@suite-common/wallet-utils';
import { AssetSymbol } from '@suite-native/assets';
import { useFormattedEarnRate } from '@suite-native/earn';
import { Translation } from '@suite-native/intl';
import { SOLANA_EPOCH_DAYS } from '@trezor/network-solana/constants';

import { type HowEarnWorksScreenPreset } from './types';
import { StakingRateDetails } from '../../staking/StakingRateDetails';

interface UseHowStakeWorksPresetProps {
    symbol: NetworkSymbol;
    entryPeriodInDays: number | null;
    unstakingPeriodInDays: number | null;
    apy: number | null;
    rateKind: StakingRateKind | null;
}

export const useHowStakeWorksPreset = ({
    symbol,
    entryPeriodInDays,
    unstakingPeriodInDays,
    apy,
    rateKind,
}: UseHowStakeWorksPresetProps): HowEarnWorksScreenPreset => {
    const apyFormatted = useFormattedEarnRate(apy);

    const isSolana = getNetworkType(symbol) === 'solana';

    const entryPeriodDescriptionId =
        entryPeriodInDays !== null
            ? 'earn.howStakeWorksScreen.stakingTimeline.second.description'
            : 'earn.notAvailable';
    const stakingPeriodTitleId = isSolana
        ? 'earn.howStakeWorksScreen.stakingTimeline.second.titleSolana'
        : 'earn.howStakeWorksScreen.stakingTimeline.second.titleEthereum';
    const stakingRewardsTitleId = isSolana
        ? 'earn.howStakeWorksScreen.stakingTimeline.third.titleSolana'
        : 'earn.howStakeWorksScreen.stakingTimeline.third.titleEthereum';
    const stakingRewardsDescriptionId = isApyAvailable(apy)
        ? 'earn.howStakeWorksScreen.stakingTimeline.third.description'
        : 'earn.notAvailableShort';
    const unstakingPeriodTitleId = isSolana
        ? 'earn.howStakeWorksScreen.unstakeTimeline.second.titleSolana'
        : 'earn.howStakeWorksScreen.unstakeTimeline.second.titleEthereum';
    const unstakingPeriodDescriptionId =
        unstakingPeriodInDays !== null
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
                        values={{ apy: apyFormatted }}
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
                        values={{
                            displaySymbol: (
                                <AssetSymbol networkSymbol={symbol} variant="body-md-strong" />
                            ),
                        }}
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
                            isSolana
                                ? 'earn.howStakeWorksScreen.benefits.third.description.solana'
                                : 'earn.howStakeWorksScreen.benefits.third.description.ethereum'
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
                            <Translation
                                id={stakingRewardsDescriptionId}
                                values={{ apy: apyFormatted }}
                            />
                        ),
                        renderDescription: description => (
                            <StakingRateDetails
                                networkSymbol={symbol}
                                rate={apy}
                                rateKind={rateKind}
                                isNestedSheet
                            >
                                {description}
                            </StakingRateDetails>
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
                                values={{
                                    symbol: (
                                        <AssetSymbol
                                            networkSymbol={symbol}
                                            variant="body-sm-strong"
                                        />
                                    ),
                                }}
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
                                values={{
                                    symbol: (
                                        <AssetSymbol
                                            networkSymbol={symbol}
                                            variant="body-sm-strong"
                                        />
                                    ),
                                }}
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
