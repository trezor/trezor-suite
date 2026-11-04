import { isUrl, isWhitelistedHost } from '@trezor/utils';

import { allowedDesktopUpdateRemoteDomains, localhostDomains } from '../config';

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

    const { hostname, protocol } = new URL(customFeedURL);

    // Localhost is allowed if explicitely demanded; the user is reponsible for anything running on localhost.
    // All protocols are allowed for localhost.
    if (isWhitelistedHost(hostname, localhostDomains)) {
        return customFeedURL;
    }

    // For the whitelisted remote domains, a secure protocol must be ensured to prevent MITM.
    if (!isWhitelistedHost(hostname, allowedDesktopUpdateRemoteDomains)) {
        warn?.(`Custom desktop update URL ${customFeedURL} is from a forbidden domain.`);

        return defaultFeedURL;
    }
    if (protocol !== 'https:') {
        warn?.(`Custom desktop update URL ${customFeedURL} must be https.`);

        return defaultFeedURL;
    }

    return customFeedURL;
};
