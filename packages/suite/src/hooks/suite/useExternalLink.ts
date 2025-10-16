import { useMemo } from 'react';

import { useSelector } from 'src/hooks/suite';
import { selectTorOnionLinks, selectTorState } from 'src/selectors/suite/suiteSelectors';
import { getTorUrlIfAvailable } from 'src/utils/suite/tor';

/**
 * Returns plain url or onion url if available and tor is active
 */
export const useExternalLink = (originalUrl?: string) => {
    const { isTorEnabled } = useSelector(selectTorState);
    const torOnionLinks = useSelector(selectTorOnionLinks);

    const url = useMemo(() => {
        if (originalUrl && isTorEnabled && torOnionLinks) {
            return getTorUrlIfAvailable(originalUrl) || originalUrl;
        }

        return originalUrl;
    }, [isTorEnabled, torOnionLinks, originalUrl]);

    return url;
};
