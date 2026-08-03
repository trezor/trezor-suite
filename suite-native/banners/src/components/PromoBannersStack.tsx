import { View } from 'react-native';
import { useSelector } from 'react-redux';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { type VisiblePromoBannerKey, selectVisiblePromoBanners } from '../selectors';
import { PromoBannerCarousel } from './PromoBannerCarousel';
import { StablecoinYieldPromoBanner } from './StablecoinYieldPromoBanner';
import { TrezorSafe7PromoBanner } from './TrezorSafe7PromoBanner';

//  This is needed to compensate the vertical margin of the parent component.
const carouselWrapperStyle = prepareNativeStyle(utils => ({
    marginVertical: -utils.spacings.sp8,
}));

const BANNER_COMPONENTS: Record<VisiblePromoBannerKey, React.ReactElement> = {
    ts7: <TrezorSafe7PromoBanner />,
    'stablecoin-yield': <StablecoinYieldPromoBanner />,
};

export const PromoBannersStack = () => {
    const { applyStyle } = useNativeStyles();
    const visiblePromoBanners = useSelector(selectVisiblePromoBanners);

    if (visiblePromoBanners.length === 0) return null;

    return (
        <View style={applyStyle(carouselWrapperStyle)}>
            <PromoBannerCarousel items={visiblePromoBanners.map(key => BANNER_COMPONENTS[key])} />
        </View>
    );
};
