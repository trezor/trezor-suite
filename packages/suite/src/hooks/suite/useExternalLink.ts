import { useMemo } from 'react';
import { useSelector } from '@suite-hooks';
import { getTorUrlIfAvailable } from '@suite-utils/tor';
import { selectTorState } from '@suite-reducers/suiteReducer';

/**
 * Returns plain url or onion url if available and tor is active
 */
export const useExternalLink = (originalUrl?: string) => {
    const { isTorEnabled } = useSelector(selectTorState);
    const torOnionLinks = useSelector(state => state.suite.settings.torOnionLinks);

    const url = useMemo(() => {
        if (originalUrl && isTorEnabled && torOnionLinks) {
            return getTorUrlIfAvailable(originalUrl) || originalUrl;
        }

        return originalUrl;
    }, [isTorEnabled, torOnionLinks, originalUrl]);

    return url;
};
