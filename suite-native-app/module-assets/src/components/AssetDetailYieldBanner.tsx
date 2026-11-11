import { useSelector } from 'react-redux';

import { type RouteProp, useRoute } from '@react-navigation/native';

import { events } from '@suite-common/analytics';
import {
    type HomeAssetTableState,
    selectWalletAssetDisplaySymbol,
    selectWalletAssetKey,
    selectWalletAssetTokenDecimals,
    selectWalletAssetTokenSymbol,
} from '@suite-common/assets';
import { useYieldVaultApy } from '@suite-common/earn-stablecoin';
import { isApyAvailable } from '@suite-common/wallet-utils';
import { injectNativeAnalytics } from '@suite-native/analytics';
import { Box } from '@suite-native/atoms';
import {
    type BannerFlagsSliceRootState,
    EarnPromoBanner,
    selectIsTokenYieldBannerClosed,
    setIsTokenYieldBannerClosed,
} from '@suite-native/banners';
import { Translation } from '@suite-native/intl';
import { useFormattedEarnRate } from '@suite-native/module-earn';
import type { AssetsStackParamList, AssetsStackRoutes } from '@suite-native/navigation';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import { useResetToEarn } from './useResetToEarn';

export const AssetDetailYieldBanner = () => {
    const { networkSymbol, tokenContract } =
        useRoute<RouteProp<AssetsStackParamList, AssetsStackRoutes.AssetDetail>>().params;
    const assetKey = useSelector((state: HomeAssetTableState) =>
        selectWalletAssetKey(state, networkSymbol, tokenContract),
    );
    const displaySymbol = useSelector((state: HomeAssetTableState) =>
        selectWalletAssetDisplaySymbol(state, assetKey),
    );
    const tokenSymbol = useSelector((state: HomeAssetTableState) =>
        selectWalletAssetTokenSymbol(state, assetKey),
    );
    const tokenDecimals = useSelector((state: HomeAssetTableState) =>
        selectWalletAssetTokenDecimals(state, assetKey),
    );
    const bannerKey = `${networkSymbol}-${tokenContract?.toLowerCase()}`;
    const isBannerClosed = useSelector((state: BannerFlagsSliceRootState) =>
        selectIsTokenYieldBannerClosed(state, bannerKey),
    );
    const apy = useYieldVaultApy({
        symbol: networkSymbol,
        contractAddress: tokenContract,
        tokenSymbol,
        tokenDecimals,
    });
    const { analytics, dispatch } = useServices(injectNativeAnalytics, injectDispatch);
    const formattedApy = useFormattedEarnRate(apy);
    const resetToEarn = useResetToEarn();

    if (
        tokenContract === undefined ||
        displaySymbol === undefined ||
        isBannerClosed ||
        apy === null ||
        !isApyAvailable(apy)
    ) {
        return null;
    }

    const reportYieldNavigate = (action: 'continue' | 'cancel') =>
        analytics.report({
            type: events.yieldNavigateEvent.name,
            payload: {
                action,
                from: 'asset-detail-banner',
                to: 'earn-dashboard',
                networkSymbol,
            },
        });

    const goToEarn = () => {
        reportYieldNavigate('continue');
        resetToEarn();
    };
    const close = () => {
        dispatch(setIsTokenYieldBannerClosed(bannerKey));
        reportYieldNavigate('cancel');
    };

    return (
        <Box paddingHorizontal="sp20" testID="@asset-detail/yield-banner">
            <EarnPromoBanner
                symbol={networkSymbol}
                title={
                    <Translation
                        id="earn.promoStakeBanner.title"
                        values={{ apy: formattedApy, symbol: displaySymbol }}
                    />
                }
                description={
                    <Translation
                        id="moduleAssets.assetDetailScreen.yieldBanner.description"
                        values={{ symbol: displaySymbol }}
                    />
                }
                onExplore={goToEarn}
                onClose={close}
            />
        </Box>
    );
};
