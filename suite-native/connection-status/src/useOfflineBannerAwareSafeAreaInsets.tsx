import { EdgeInsets, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useIsOfflineBannerVisible } from './useIsOfflineBannerVisible';

// If offline banner is visible, return 0 for top inset, otherwise return the top inset from safe area insets
// this is because the offline banner is displayed on top of the screen and we don't want to add any top padding
export const useOfflineBannerAwareSafeAreaInsets = () => {
    const { top, ...rest } = useSafeAreaInsets();
    const isOfflineBannerVisible = useIsOfflineBannerVisible();

    return { top: isOfflineBannerVisible ? 0 : top, ...rest } as EdgeInsets;
};
