import { isUrl, isWhitelistedHost } from '@trezor/utils';

import { allowedDesktopUpdateDomains } from '../config';

type ParseCustomFeedURLParams = {
    customFeedURL: string;
    defaultFeedURL: string;
};

/**
 * Parse desktop updater feed URL from process switch and validate it, or keep default value.
 * Restricting the URL is only a secondary measure, see `allowedDesktopUpdateDomains`.
 */
export const parseCustomFeedURL = ({ customFeedURL, defaultFeedURL }: ParseCustomFeedURLParams) => {
    if (customFeedURL === '') {
        return defaultFeedURL;
    }

    if (!isUrl(customFeedURL)) {
        return defaultFeedURL;
    }

    const { hostname } = new URL(customFeedURL);

    if (!isWhitelistedHost(hostname, allowedDesktopUpdateDomains)) {
        return defaultFeedURL;
    }

    return customFeedURL;
};
