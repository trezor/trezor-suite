import { useSelector } from 'react-redux';

import { type RouteProp, useRoute } from '@react-navigation/native';

import {
    type HomeAssetTableState,
    selectWalletAssetAvailableAmount,
    selectWalletAssetKey,
    selectWalletAssetStakingAmount,
} from '@suite-common/assets';
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
    onPress: () => void;
};

export const AssetDetailEarnBanner = ({ onPress }: AssetDetailEarnBannerProps) => {
    const { networkSymbol, tokenContract } =
        useRoute<RouteProp<AssetsStackParamList, AssetsStackRoutes.AssetDetail>>().params;
    const assetKey = useSelector((state: HomeAssetTableState) =>
        selectWalletAssetKey(state, networkSymbol, tokenContract),
    );
    const availableAmount = useSelector((state: HomeAssetTableState) =>
        selectWalletAssetAvailableAmount(state, assetKey),
    );
    const stakingAmount = useSelector((state: HomeAssetTableState) =>
        selectWalletAssetStakingAmount(state, assetKey),
    );
    const stakingApy = useSelector((state: StakeRootState) =>
        tokenContract === undefined ? selectApy(state, { networkSymbol }) : null,
    );
    const { PercentageFormatter } = useFormatters();
    const { applyStyle } = useNativeStyles();
    const displayedStakingApy = stakingApy ?? 0;
    const shouldShowEarnBanner =
        isApyAvailable(displayedStakingApy) &&
        isPositiveBalance(availableAmount ?? '0') &&
        !isPositiveBalance(stakingAmount ?? '0');

    if (!shouldShowEarnBanner) {
        return null;
    }

    return (
        <CompactCardWithIconLayout
            icon="piggyBank"
            iconSize={32}
            contentPadding={{ horizontal: 'sp12', vertical: 'sp8' }}
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
                            apy: PercentageFormatter.format(displayedStakingApy),
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
