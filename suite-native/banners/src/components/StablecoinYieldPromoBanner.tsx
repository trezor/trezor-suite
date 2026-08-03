import { useDispatch } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { Translation } from '@suite-native/intl';
import {
    type AppTabsParamList,
    AppTabsRoutes,
    EarnStackRoutes,
    type TabNavigationProp,
} from '@suite-native/navigation';

import { setIsStablecoinYieldPromoBannerClosed } from '../bannerFlagsSlice';
import { Banner } from './Banner';
import { STABLECOIN_YIELD_PROMO_BANNER_IMAGE } from '../imageSources';

type NavigationProps = TabNavigationProp<AppTabsParamList, AppTabsRoutes>;

export const StablecoinYieldPromoBanner = () => {
    const dispatch = useDispatch();
    const navigation = useNavigation<NavigationProps>();

    const handlePress = () => {
        navigation.navigate(AppTabsRoutes.EarnStack, {
            screen: EarnStackRoutes.Earn,
        });
    };

    const handleClose = () => {
        dispatch(setIsStablecoinYieldPromoBannerClosed());
    };

    return (
        <Banner
            title={<Translation id="banner.stablecoinYieldPromoBanner.title" />}
            ctaText={<Translation id="banner.stablecoinYieldPromoBanner.button" />}
            imageSource={STABLECOIN_YIELD_PROMO_BANNER_IMAGE}
            onPress={handlePress}
            onClose={handleClose}
            testID="@home/stablecoin-yield-promo-cta"
        />
    );
};
