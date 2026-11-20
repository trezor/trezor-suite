import { View } from 'react-native';
import { useSelector } from 'react-redux';

import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import { type VisiblePromoBannerKey, selectVisiblePromoBanners } from '../selectors';
import { BlackFridayHolidayPromoBanner } from './BlackFridayHolidayPromoBanner';
import { DefiYieldPromoBanner } from './DefiYieldPromoBanner';
import { EthVaultPromoBanner } from './EthVaultPromoBanner';
import { PromoBannerCarousel } from './PromoBannerCarousel';
import { TradingExperiencePromoBanner } from './TradingExperiencePromoBanner';
import { TrezorSafe7PromoBanner } from './TrezorSafe7PromoBanner';

type CarouselWrapperStyleProps = {
    hasNegativeVerticalMargin: boolean;
    hasHorizontalMargin: boolean;
};

const carouselWrapperStyle = prepareNativeStyle<CarouselWrapperStyleProps>(
    (utils, { hasNegativeVerticalMargin, hasHorizontalMargin }) => ({
        //  This is needed to compensate the vertical margin of the parent component.
        marginVertical: hasNegativeVerticalMargin ? -utils.spacings.sp8 : 0,
        marginHorizontal: hasHorizontalMargin ? utils.spacings.sp16 : 0,
    }),
);

const BANNER_COMPONENTS: Record<VisiblePromoBannerKey, React.ReactElement> = {
    'bfh26-ts7-accessory-pack': (
        <BlackFridayHolidayPromoBanner bannerType="bfh26-ts7-accessory-pack" />
    ),
    'bfh26-keep-metal': <BlackFridayHolidayPromoBanner bannerType="bfh26-keep-metal" />,
    'bfh26-ts3-gift': <BlackFridayHolidayPromoBanner bannerType="bfh26-ts3-gift" />,
    'bfh26-ts3-backup': <BlackFridayHolidayPromoBanner bannerType="bfh26-ts3-backup" />,
    'bfh26-ts7-complete-kit': <BlackFridayHolidayPromoBanner bannerType="bfh26-ts7-complete-kit" />,
    'bfh26-egift-card': <BlackFridayHolidayPromoBanner bannerType="bfh26-egift-card" />,
    'bfh26-ts7-upgrade': <BlackFridayHolidayPromoBanner bannerType="bfh26-ts7-upgrade" />,
    ts7: <TrezorSafe7PromoBanner />,
    'defi-yield': <DefiYieldPromoBanner />,
    'eth-vault': <EthVaultPromoBanner />,
    'trading-experience': <TradingExperiencePromoBanner />,
};

type PromoBannersProps = {
    hasNegativeVerticalMargin?: boolean;
    hasHorizontalMargin?: boolean;
};

export const PromoBanners = ({
    hasNegativeVerticalMargin = true,
    hasHorizontalMargin = false,
}: PromoBannersProps) => {
    const { applyStyle } = useNativeStyles();
    const visiblePromoBanners = useSelector(selectVisiblePromoBanners);

    if (visiblePromoBanners.length === 0) return null;

    return (
        <View
            style={applyStyle(carouselWrapperStyle, {
                hasNegativeVerticalMargin,
                hasHorizontalMargin,
            })}
        >
            <PromoBannerCarousel items={visiblePromoBanners.map(key => BANNER_COMPONENTS[key])} />
        </View>
    );
};
