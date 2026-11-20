import { useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSetAtom } from 'jotai';

import { isAnyBannerRenderedAtom } from '@suite-native/atoms';
import { OfflineBanner, useIsOfflineBannerVisible } from '@suite-native/connection-status';
import { DeviceDangerBanner, useIsDeviceDangerBannerVisible } from '@suite-native/device';
import {
    MessageSystemBannerRenderer,
    useIsMessageSystemBannerVisible,
} from '@suite-native/message-system';

export const BannersRenderer = () => {
    const setIsAnyBannerRenderedAtom = useSetAtom(isAnyBannerRenderedAtom);

    const isOfflineBannerVisible = useIsOfflineBannerVisible();
    const isDeviceDangerBannerVisible = useIsDeviceDangerBannerVisible();
    const isMessageSystemBannerVisible = useIsMessageSystemBannerVisible();

    // If any banner is rendered, let it be known to components rendered below (e.g. Screen),
    // so that they can adjust their top insets accordingly (via useBannerAwareSafeAreaInsets).
    const isAnyBannerVisible =
        isMessageSystemBannerVisible || isOfflineBannerVisible || isDeviceDangerBannerVisible;

    useEffect(
        () => setIsAnyBannerRenderedAtom(isAnyBannerVisible),
        [isAnyBannerVisible, setIsAnyBannerRenderedAtom],
    );

    // ensure that only the first banner, as per the order they're rendered, has the top inset
    const { top } = useSafeAreaInsets();
    const topInsetOfflineBanner = top;
    const topInsetDeviceCompromisedBanner = isOfflineBannerVisible ? 0 : top;
    const topInsetMessageSystemBanner =
        isOfflineBannerVisible || isDeviceDangerBannerVisible ? 0 : top;

    return (
        <>
            <OfflineBanner topSafeAreaInset={topInsetOfflineBanner} />
            <DeviceDangerBanner topSafeAreaInset={topInsetDeviceCompromisedBanner} />
            <MessageSystemBannerRenderer topSafeAreaInset={topInsetMessageSystemBanner} />
        </>
    );
};
