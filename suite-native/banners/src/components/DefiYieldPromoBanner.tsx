import { useDispatch } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { events as commonAnalyticsEvents } from '@suite-common/analytics';
import { useServices } from '@suite-common/dependency-injection';
import { selectNativeAnalyticsDep } from '@suite-native/analytics';
import { Translation } from '@suite-native/intl';
import {
    type AppTabsParamList,
    AppTabsRoutes,
    EarnStackRoutes,
    type TabNavigationProp,
} from '@suite-native/navigation';

import { setIsDefiYieldPromoBannerClosed } from '../bannerFlagsSlice';
import { DEFI_YIELD_PROMO_BANNER_IMAGE } from '../imageSources';
import { Banner } from './Banner';

type NavigationProps = TabNavigationProp<AppTabsParamList, AppTabsRoutes>;

export const DefiYieldPromoBanner = () => {
    const dispatch = useDispatch();
    const { analytics } = useServices(selectNativeAnalyticsDep);
    const navigation = useNavigation<NavigationProps>();

    const handlePress = () => {
        analytics.report({
            type: commonAnalyticsEvents.promoDashboardBannerEvent.name,
            payload: { action: 'cta', bannerType: 'defi-yield' },
        });
        navigation.navigate(AppTabsRoutes.EarnStack, {
            screen: EarnStackRoutes.Earn,
        });
    };

    const handleClose = () => {
        analytics.report({
            type: commonAnalyticsEvents.promoDashboardBannerEvent.name,
            payload: { action: 'close', bannerType: 'defi-yield' },
        });
        dispatch(setIsDefiYieldPromoBannerClosed());
    };

    return (
        <Banner
            title={<Translation id="banner.defiYieldPromoBanner.title" />}
            ctaText={<Translation id="banner.defiYieldPromoBanner.button" />}
            imageSource={DEFI_YIELD_PROMO_BANNER_IMAGE}
            onPress={handlePress}
            onClose={handleClose}
            testID="@home/defi-yield-promo-cta"
        />
    );
};
