import { useSelector } from 'react-redux';

import { type RouteProp, useRoute } from '@react-navigation/native';

import { useFormatters } from '@suite-common/formatters';
import { getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { type StakeRootState, type WalletAssetKey, selectApy } from '@suite-common/wallet-core';
import { CompactCardWithIconLayout, Text } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import type { AssetsStackParamList, AssetsStackRoutes } from '@suite-native/navigation';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import {
    type AssetDetailEarnState,
    selectShouldShowWalletAssetEarnBanner,
} from '../assetDetailEarnSelectors';

const bannerStyle = prepareNativeStyle(utils => ({
    backgroundColor: utils.colors.elementFillBrandSofter,
    borderRadius: utils.borders.radii.r12,
}));

type AssetDetailEarnBannerProps = {
    assetKey: WalletAssetKey | undefined;
    onPress: () => void;
};

export const AssetDetailEarnBanner = ({ assetKey, onPress }: AssetDetailEarnBannerProps) => {
    const { networkSymbol } =
        useRoute<RouteProp<AssetsStackParamList, AssetsStackRoutes.AssetDetail>>().params;
    const stakingApy = useSelector((state: StakeRootState) => selectApy(state, { networkSymbol }));
    const { PercentageFormatter } = useFormatters();
    const { applyStyle } = useNativeStyles();
    const shouldShowEarnBanner = useSelector((state: AssetDetailEarnState) =>
        selectShouldShowWalletAssetEarnBanner(state, assetKey),
    );

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
