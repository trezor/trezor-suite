import { useSelector } from 'react-redux';

import { useNetInfo } from '@react-native-community/netinfo';

import { selectIsOnboardingFinished } from '@suite-native/settings';

export const useIsOfflineBannerVisible = () => {
    const isOnboardingFinished = useSelector(selectIsOnboardingFinished);
    const { isConnected } = useNetInfo();

    return !isConnected && isOnboardingFinished;
};
