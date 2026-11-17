import { useSelector } from 'react-redux';

import { redactNumericalSubstring, useDiscreetMode } from '@suite-common/discreet-mode';
import {
    type StakingRootState,
    formatStakingAmount,
    getPotentialStakingRewards,
    selectStakeableStakingProductDescriptorBySymbol,
    useNetworkStakingRate,
} from '@suite-common/earn-staking';
import { useFormatters } from '@suite-common/formatters';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import { isPositiveBalance } from '@suite-common/wallet-utils';
import { AssetSymbol } from '@suite-native/assets';
import { EarnPromoBanner } from '@suite-native/banners';
import { useFormattedEarnRate } from '@suite-native/earn';
import { Translation } from '@suite-native/intl';

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
    const { rate, rateKind } = useNetworkStakingRate({
        networkSymbol,
        accountKey: accounts.at(0)?.key,
    });
    const limits = useSelector(
        (state: StakingRootState) =>
            selectStakeableStakingProductDescriptorBySymbol(state, networkSymbol)?.limits ?? null,
    );
    const formattedRate = useFormattedEarnRate(rate);
    const { CryptoAmountFormatter } = useFormatters();
    const { isDiscreetMode } = useDiscreetMode();

    const rewards = getPotentialStakingRewards({ accounts, limits, rate });

    const formattedRewards = CryptoAmountFormatter.format(
        formatStakingAmount({ amount: rewards, networkSymbol }),
        {
            symbol: networkSymbol,
            isBalance: true,
            withSymbol: false,
            isEllipsisAppended: false,
            maxDisplayedDecimals: 8,
        },
    );
    const displayedRewards = isDiscreetMode
        ? redactNumericalSubstring(formattedRewards)
        : formattedRewards;
    const isAprRate = rateKind === 'apr';

    return (
        <EarnPromoBanner
            symbol={networkSymbol}
            title={
                isAprRate ? (
                    <Translation
                        id="moduleAssets.assetDetailScreen.stakingBanner.titleApr"
                        values={{
                            apr: formattedRate,
                            symbol: (
                                <AssetSymbol networkSymbol={networkSymbol} color="contentBrand" />
                            ),
                        }}
                    />
                ) : (
                    <Translation
                        id="moduleAssets.assetDetailScreen.stakingBanner.title"
                        values={{
                            apy: formattedRate,
                            symbol: (
                                <AssetSymbol networkSymbol={networkSymbol} color="contentBrand" />
                            ),
                        }}
                    />
                )
            }
            description={
                isPositiveBalance(rewards) ? (
                    <Translation
                        id={
                            isAprRate
                                ? 'moduleAssets.assetDetailScreen.stakingBanner.descriptionWithRewardsApr'
                                : 'moduleAssets.assetDetailScreen.stakingBanner.descriptionWithRewards'
                        }
                        values={{
                            potentialRewards: displayedRewards,
                            symbol: (
                                <AssetSymbol
                                    networkSymbol={networkSymbol}
                                    variant="body-sm"
                                    color="contentBrand"
                                />
                            ),
                        }}
                    />
                ) : (
                    <Translation
                        id="moduleAssets.assetDetailScreen.stakingBanner.description"
                        values={{
                            symbol: (
                                <AssetSymbol
                                    networkSymbol={networkSymbol}
                                    variant="body-sm"
                                    color="contentBrand"
                                />
                            ),
                        }}
                    />
                )
            }
            onExplore={onExplore}
        />
    );
};
