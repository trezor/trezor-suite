import { isUrl, isWhitelistedHost } from '@trezor/utils';

import { allowedDesktopUpdateDomains } from '../config';

type ParseCustomFeedURLParams = {
    customFeedURL: string;
    defaultFeedURL: string;
    warn?: (message: string) => void;
};

/**
 * Parse desktop updater feed URL from process switch and validate it, or keep default value.
 * Restricting the URL is only a secondary measure, see `allowedDesktopUpdateDomains`.
 */
export const parseCustomFeedURL = ({
    customFeedURL,
    defaultFeedURL,
    warn,
}: ParseCustomFeedURLParams) => {
    if (customFeedURL === '') {
        return defaultFeedURL;
    }

    if (!isUrl(customFeedURL)) {
        warn?.(`Custom desktop update URL ${customFeedURL} is not a valid URL.`);

        return defaultFeedURL;
    }

    const { hostname } = new URL(customFeedURL);

    if (!isWhitelistedHost(hostname, allowedDesktopUpdateDomains)) {
        warn?.(`Custom desktop update URL ${customFeedURL} is from a forbidden domain.`);

        return defaultFeedURL;
    }

    return customFeedURL;
};
