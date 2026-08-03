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

import { setIsEthVaultPromoBannerClosed } from '../bannerFlagsSlice';
import { ETH_VAULT_PROMO_BANNER_IMAGE } from '../imageSources';
import { Banner } from './Banner';

type NavigationProps = TabNavigationProp<AppTabsParamList, AppTabsRoutes>;

export const EthVaultPromoBanner = () => {
    const dispatch = useDispatch();
    const { analytics } = useServices(selectNativeAnalyticsDep);
    const navigation = useNavigation<NavigationProps>();

    const handlePress = () => {
        analytics.report({
            type: commonAnalyticsEvents.promoDashboardBannerEvent.name,
            payload: { action: 'cta', bannerType: 'eth-vault' },
        });
        navigation.navigate(AppTabsRoutes.EarnStack, {
            screen: EarnStackRoutes.Earn,
        });
    };

    const handleClose = () => {
        analytics.report({
            type: commonAnalyticsEvents.promoDashboardBannerEvent.name,
            payload: { action: 'close', bannerType: 'eth-vault' },
        });
        dispatch(setIsEthVaultPromoBannerClosed());
    };

    return (
        <Banner
            title={<Translation id="banner.ethVaultPromoBanner.title" />}
            ctaText={<Translation id="banner.ethVaultPromoBanner.button" />}
            imageSource={ETH_VAULT_PROMO_BANNER_IMAGE}
            onPress={handlePress}
            onClose={handleClose}
            testID="@home/eth-vault-promo-cta"
        />
    );
};
