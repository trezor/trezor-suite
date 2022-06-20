import { useMemo } from 'react';
import { useSelector } from '@suite-hooks';
import { getIsTorEnabled, getTorUrlIfAvailable } from '@suite-utils/tor';

/**
 * Returns plain url or onion url if available and tor is active
 */
export const useExternalLink = (originalUrl?: string) => {
    const { isTorEnabled, torOnionLinks } = useSelector(state => ({
        isTorEnabled: getIsTorEnabled(state.suite.torStatus),
        torOnionLinks: state.suite.settings.torOnionLinks,
    }));

    const url = useMemo(() => {
        if (originalUrl && isTorEnabled && torOnionLinks) {
            return getTorUrlIfAvailable(originalUrl) || originalUrl;
        }

        return originalUrl;
    }, [isTorEnabled, torOnionLinks, originalUrl]);

    return url;
};
