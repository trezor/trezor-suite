import { EdgeInsets, useSafeAreaInsets } from 'react-native-safe-area-context';

import { atom, useAtomValue } from 'jotai';

export const isAnyBannerRenderedAtom = atom(false);

/**
 * Get top safe area inset, considering if there is any banner currently rendered.
 * If there is, then it already uses the safe inset (see BannersRenderer).
 * and we don't want to duplicate the inset for content below the banner.
 */
export const useBannerAwareSafeAreaInsets = (): EdgeInsets => {
    const { top, ...rest } = useSafeAreaInsets();

    const isCurrentlyAnyBannerRendered = useAtomValue(isAnyBannerRenderedAtom);

    return { top: isCurrentlyAnyBannerRendered ? 0 : top, ...rest };
};
