import { redactNumericalSubstring, useDiscreetMode } from '@suite-common/discreet-mode';
import { useFormatters } from '@suite-common/formatters';
import { type NetworkSymbol, getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { getPotentialStakingRewards } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { EarnPromoBanner } from '@suite-native/banners';
import { getStakingRateLabelType, useStakingRate } from '@suite-native/earn';
import { Translation } from '@suite-native/intl';
import { useFormattedEarnRate } from '@suite-native/module-earn';

type AssetDetailStakingRewardsBannerProps = {
    networkSymbol: NetworkSymbol;
    accounts: readonly Account[];
    onExplore: () => void;
};

export const AssetDetailStakingRewardsBanner = ({
    networkSymbol,
    accounts,
    onExplore,
}: AssetDetailStakingRewardsBannerProps) => {
    const { rate } = useStakingRate({ symbol: networkSymbol, accountKey: accounts.at(0)?.key });
    const formattedRate = useFormattedEarnRate(rate);
    const { CryptoAmountFormatter } = useFormatters();
    const { isDiscreetMode } = useDiscreetMode();

    const symbol = getNetworkDisplaySymbol(networkSymbol);
    const rewards = getPotentialStakingRewards(accounts, rate ?? null);
    const formattedRewards = CryptoAmountFormatter.format(rewards.toFixed(), {
        symbol: networkSymbol,
        isBalance: true,
        withSymbol: false,
        isEllipsisAppended: false,
        maxDisplayedDecimals: 8,
    });
    const displayedRewards = isDiscreetMode
        ? redactNumericalSubstring(formattedRewards)
        : formattedRewards;
    const isAprRate = getStakingRateLabelType(networkSymbol) === 'apr';

    return (
        <EarnPromoBanner
            symbol={networkSymbol}
            title={
                isAprRate ? (
                    <Translation
                        id="moduleAssets.assetDetailScreen.stakingBanner.titleApr"
                        values={{ apr: formattedRate, symbol }}
                    />
                ) : (
                    <Translation
                        id="moduleAssets.assetDetailScreen.stakingBanner.title"
                        values={{ apy: formattedRate, symbol }}
                    />
                )
            }
            description={
                rewards.gt(0) ? (
                    <Translation
                        id={
                            isAprRate
                                ? 'moduleAssets.assetDetailScreen.stakingBanner.descriptionWithRewardsApr'
                                : 'moduleAssets.assetDetailScreen.stakingBanner.descriptionWithRewards'
                        }
                        values={{
                            potentialRewards: displayedRewards,
                            symbol,
                        }}
                    />
                ) : (
                    <Translation
                        id="moduleAssets.assetDetailScreen.stakingBanner.description"
                        values={{ symbol }}
                    />
                )
            }
            onExplore={onExplore}
        />
    );
};
