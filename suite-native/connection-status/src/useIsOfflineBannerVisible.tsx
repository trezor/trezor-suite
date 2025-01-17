import { useSelector } from 'react-redux';

import { useNetInfo } from '@react-native-community/netinfo';

import { selectIsOnboardingFinished } from '@suite-native/settings';

import { useIsFwRevisionCheckOfflineError } from './useIsFwRevisionCheckOfflineError';

export const useIsOfflineBannerVisible = () => {
    const isOnboardingFinished = useSelector(selectIsOnboardingFinished);
    const { isInternetReachable } = useNetInfo();
    const isReachable = isInternetReachable ?? true;
    const isFwRevisionCheckOfflineError = useIsFwRevisionCheckOfflineError();

    return (!isReachable || isFwRevisionCheckOfflineError) && isOnboardingFinished;
};
