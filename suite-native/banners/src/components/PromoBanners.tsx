import { useEffect } from 'react';
import { View } from 'react-native';
import { useSelector } from 'react-redux';

import { isDevEnv } from '@suite-common/suite-utils';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

import {
    type VisiblePromoBannerKey,
    selectPromoBannerConfigErrors,
    selectVisiblePromoBanners,
} from '../selectors';
import { DefiYieldPromoBanner } from './DefiYieldPromoBanner';
import { EthVaultPromoBanner } from './EthVaultPromoBanner';
import { PromoBannerCarousel } from './PromoBannerCarousel';
import { TrezorSafe7PromoBanner } from './TrezorSafe7PromoBanner';

//  This is needed to compensate the vertical margin of the parent component.
const carouselWrapperStyle = prepareNativeStyle(utils => ({
    marginVertical: -utils.spacings.sp8,
}));

const BANNER_COMPONENTS: Record<VisiblePromoBannerKey, React.ReactElement> = {
    ts7: <TrezorSafe7PromoBanner />,
    'defi-yield': <DefiYieldPromoBanner />,
    'eth-vault': <EthVaultPromoBanner />,
};

export const PromoBanners = () => {
    const { applyStyle } = useNativeStyles();
    const promoBannerConfigErrors = useSelector(selectPromoBannerConfigErrors);
    const visiblePromoBanners = useSelector(selectVisiblePromoBanners);

    useEffect(() => {
        if (!isDevEnv || promoBannerConfigErrors.length === 0) {
            return;
        }

        console.error(promoBannerConfigErrors.join('\n'));
    }, [promoBannerConfigErrors]);

    if (visiblePromoBanners.length === 0) return null;

    return (
        <View style={applyStyle(carouselWrapperStyle)}>
            <PromoBannerCarousel items={visiblePromoBanners.map(key => BANNER_COMPONENTS[key])} />
        </View>
    );
};
