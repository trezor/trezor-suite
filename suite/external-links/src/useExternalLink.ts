import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { selectTorOnionLinks } from '@suite/settings';
import { selectIsTorEnabled } from '@suite/tor';

import { getTorUrlIfAvailable } from './getTorUrlIfAvailable';

/**
 * Returns plain url or onion url if available and tor is active
 */
export const useExternalLink = (originalUrl?: string) => {
    const isTorEnabled = useSelector(selectIsTorEnabled);
    const torOnionLinks = useSelector(selectTorOnionLinks);

    const url = useMemo(() => {
        if (originalUrl && isTorEnabled && torOnionLinks) {
            return getTorUrlIfAvailable(originalUrl) || originalUrl;
        }

        return originalUrl;
    }, [isTorEnabled, torOnionLinks, originalUrl]);

    return url;
};
