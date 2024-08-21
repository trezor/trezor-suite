import { useSelector } from 'react-redux';

import { useNetInfo } from '@react-native-community/netinfo';

import { selectIsOnboardingFinished } from '@suite-native/settings';

export const useIsOfflineBannerVisible = () => {
    const isOnboardingFinished = useSelector(selectIsOnboardingFinished);
    const { isConnected: isNetInfoConnected } = useNetInfo({
        reachabilityUrl: 'https://cdn.trezor.io/204',
    });

    const isConnected = isNetInfoConnected ?? true;

    return !isConnected && isOnboardingFinished;
};
