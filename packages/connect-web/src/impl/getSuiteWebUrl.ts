const DEV_CONNECT_ORIGIN = 'https://dev.suite.sldev.cz';
const DEV_CONNECT_PREFIX = `${DEV_CONNECT_ORIGIN}/connect/`;

/**
 * Extract branch name from a connect-explorer dev URL.
 *
 * Expected URL patterns:
 *   https://dev.suite.sldev.cz/connect/{branch}/methods/...
 *   https://dev.suite.sldev.cz/connect/{branch}/settings/
 *   https://dev.suite.sldev.cz/connect/{branch}
 *
 * Branch names may contain slashes (e.g. "feat/xyz/phase-1").
 * Returns undefined if the URL doesn't match the expected pattern.
 */
export const extractBranch = (href: string): string | undefined => {
    let pathname: string;

    try {
        pathname = new URL(href).pathname;
    } catch {
        pathname = new URL(href, DEV_CONNECT_ORIGIN).pathname;
    }

    const match = pathname.match(/\/connect\/(.+)/);
    if (!match) return undefined;

    return (
        match[1]
            // Greedy (.+) ensures we strip the *last* /methods or /settings delimiter,
            // so branch names containing these words (e.g. "feat/methods-fix") are safe.
            .replace(/^(.+)\/(?:methods|settings)(?:\/.*)?$/, '$1')
            .replace(/\/$/, '') || undefined
    );
};

/**
 * Resolve the Suite Web popup URL based on the current window location.
 *
 * - localhost:8088 → localhost:8000/connect-popup (local dev)
 * - dev.suite.sldev.cz/connect/{branch}/... → dev.suite.sldev.cz/suite-web/{branch}/web/connect-popup
 * - everything else → production suite.trezor.io/web/connect-popup
 */
export const getSuiteWebUrl = (href: string, origin: string): string => {
    if (origin === 'http://localhost:8088') {
        return 'http://localhost:8000/connect-popup';
    }

    if (href.startsWith(DEV_CONNECT_PREFIX)) {
        const branch = extractBranch(href);
        if (branch) {
            return `${DEV_CONNECT_ORIGIN}/suite-web/${branch}/web/connect-popup`;
        }
    }

    return 'https://suite.trezor.io/web/connect-popup';
};
