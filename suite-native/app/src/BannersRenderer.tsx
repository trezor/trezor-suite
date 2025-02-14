import { useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSetAtom } from 'jotai';

import { isAnyBannerRenderedAtom } from '@suite-native/atoms';
import { OfflineBanner, useIsOfflineBannerVisible } from '@suite-native/connection-status';
import {
    MessageSystemBannerRenderer,
    useIsMessageSystemBannerVisible,
} from '@suite-native/message-system';
import {
    DeviceCompromisedBanner,
    useIsDeviceCompromisedBannerVisible,
} from '@suite-native/module-authenticity-checks';

export const BannersRenderer = () => {
    const setIsAnyBannerRenderedAtom = useSetAtom(isAnyBannerRenderedAtom);

    const isOfflineBannerVisible = useIsOfflineBannerVisible();
    const isDeviceCompromisedBannerVisible = useIsDeviceCompromisedBannerVisible();
    const isMessageSystemBannerVisible = useIsMessageSystemBannerVisible();

    // If any banner is rendered, let it be known to components rendered below (e.g. Screen),
    // so that they can adjust their top insets accordingly (via useBannerAwareSafeAreaInsets).
    const isAnyBannerVisible =
        isMessageSystemBannerVisible || isOfflineBannerVisible || isDeviceCompromisedBannerVisible;

    useEffect(
        () => setIsAnyBannerRenderedAtom(isAnyBannerVisible),
        [isAnyBannerVisible, setIsAnyBannerRenderedAtom],
    );

    // ensure that only the first banner, as per the order they're rendered, has the top inset
    const { top } = useSafeAreaInsets();
    const topInsetOfflineBanner = top;
    const topInsetDeviceCompromisedBanner = isOfflineBannerVisible ? 0 : top;
    const topInsetMessageSystemBanner =
        isOfflineBannerVisible || isDeviceCompromisedBannerVisible ? 0 : top;

    return (
        <>
            <OfflineBanner topSafeAreaInset={topInsetOfflineBanner} />
            <DeviceCompromisedBanner topSafeAreaInset={topInsetDeviceCompromisedBanner} />
            <MessageSystemBannerRenderer topSafeAreaInset={topInsetMessageSystemBanner} />
        </>
    );
};
