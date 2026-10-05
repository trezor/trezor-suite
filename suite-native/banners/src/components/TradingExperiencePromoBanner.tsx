import { useNavigation } from '@react-navigation/native';

import { events as commonAnalyticsEvents } from '@suite-common/analytics';
import { useServices } from '@suite-common/dependency-injection';
import { injectDispatch } from '@suite-common/redux-utils';
import { injectNativeAnalytics } from '@suite-native/analytics';
import { Translation } from '@suite-native/intl';
import {
    type AppTabsParamList,
    AppTabsRoutes,
    type TabNavigationProp,
    TradingStackRoutes,
} from '@suite-native/navigation';

import { setIsTradingExperiencePromoBannerClosed } from '../bannerFlagsSlice';
import { TRADING_EXPERIENCE_PROMO_BANNER_IMAGE } from '../imageSources';
import { Banner } from './Banner';

type NavigationProps = TabNavigationProp<AppTabsParamList, AppTabsRoutes>;

export const TradingExperiencePromoBanner = () => {
    const { analytics, dispatch } = useServices(injectNativeAnalytics, injectDispatch);
    const navigation = useNavigation<NavigationProps>();

    const handlePress = () => {
        analytics.report({
            type: commonAnalyticsEvents.promoDashboardBannerEvent.name,
            payload: { action: 'cta', bannerType: 'trading-experience' },
        });
        navigation.navigate(AppTabsRoutes.TradeStack, {
            screen: TradingStackRoutes.Trading,
            params: { tradingType: 'exchange' },
        });
    };

    const handleClose = () => {
        analytics.report({
            type: commonAnalyticsEvents.promoDashboardBannerEvent.name,
            payload: { action: 'close', bannerType: 'trading-experience' },
        });
        dispatch(setIsTradingExperiencePromoBannerClosed());
    };

    return (
        <Banner
            title={<Translation id="banner.tradingExperiencePromoBanner.title" />}
            ctaText={<Translation id="banner.tradingExperiencePromoBanner.button" />}
            imageSource={TRADING_EXPERIENCE_PROMO_BANNER_IMAGE}
            onPress={handlePress}
            onClose={handleClose}
            testID="@home/trading-experience-promo-cta"
        />
    );
};
