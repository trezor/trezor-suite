import { useSelector } from 'react-redux';

import { type RouteProp, useRoute } from '@react-navigation/native';

import { useFormatters } from '@suite-common/formatters';
import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { type StakeRootState, selectApy } from '@suite-common/wallet-core';
import { isApyAvailable, isPositiveBalance } from '@suite-common/wallet-utils';
import { CompactCardWithIconLayout, Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import type { AssetsStackParamList, AssetsStackRoutes } from '@suite-native/navigation';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

const bannerStyle = prepareNativeStyle(utils => ({
    backgroundColor: utils.colors.elementFillBrandSofter,
    borderRadius: utils.borders.radii.r12,
}));

type AssetDetailEarnBannerProps = {
    availableAmount: string;
    stakingAmount: string;
    onPress: () => void;
};

export const AssetDetailEarnBanner = ({
    availableAmount,
    stakingAmount,
    onPress,
}: AssetDetailEarnBannerProps) => {
    const { networkSymbol, tokenContract } =
        useRoute<RouteProp<AssetsStackParamList, AssetsStackRoutes.AssetDetail>>().params;
    const stakingApy = useSelector((state: StakeRootState) =>
        tokenContract === undefined ? selectApy(state, { networkSymbol }) : null,
    );
    const { PercentageFormatter } = useFormatters();
    const { applyStyle } = useNativeStyles();
    // Promotes staking only while there is a balance to stake and nothing staked yet. The section
    // itself stays visible for already staked assets.
    const shouldShowEarnBanner =
        isApyAvailable(stakingApy) &&
        isPositiveBalance(availableAmount) &&
        !isPositiveBalance(stakingAmount);

    if (!shouldShowEarnBanner) {
        return null;
    }

    return (
        <CompactCardWithIconLayout
            icon="piggyBank"
            iconSize={32}
            paddingHorizontal="sp12"
            paddingVertical="sp8"
            title={
                <Text variant="body-sm-strong" color="contentBrand">
                    <Translation id="moduleAssets.assetDetailScreen.earnSection.banner.title" />
                </Text>
            }
            subtitle={
                <Text variant="body-xs" color="contentBrand">
                    <Translation
                        id="moduleAssets.assetDetailScreen.earnSection.banner.description"
                        values={{
                            apy: PercentageFormatter.format(stakingApy ?? 0),
                            symbol: getNetworkDisplaySymbol(networkSymbol),
                        }}
                    />
                </Text>
            }
            onPress={onPress}
            variant="primary"
            borderColor="elementBorderBrandSofter"
            noShadow
            style={applyStyle(bannerStyle)}
            testID="@assets/asset-detail/earn-banner"
        />
    );
};
