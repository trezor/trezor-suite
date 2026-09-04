import { useMemo } from 'react';

import { iframeUrl } from '../components/schemas';

/**
 * Accept any string, return the origin if the string is secure, valid URL, otherwise return undefined.
 */
export function useIframeOrigin(targetUrl: string) {
    return useMemo(() => {
        const result = iframeUrl.safeParse(targetUrl);

        return result.success ? result.data.origin : undefined;
    }, [targetUrl]);
}
