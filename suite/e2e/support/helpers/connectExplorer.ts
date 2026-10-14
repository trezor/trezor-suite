const DEFAULT_CONNECT_EXPLORER_URL = 'http://localhost:8088/';

/**
 * Base URL of the Connect Explorer under test. Defaults to the local `yarn connect:explorer` dev
 * server; CI points it at the per-PR preview deployment (`https://dev.suite.sldev.cz/connect/<branch>/`),
 * which is only reachable from CI.
 */
export const getConnectExplorerUrl = (): string => {
    const url = process.env.CONNECT_EXPLORER_URL || DEFAULT_CONNECT_EXPLORER_URL;

    return url.endsWith('/') ? url : `${url}/`;
};

/**
 * Mirrors `getRouteTestIdSegment` in `packages/connect-explorer-theme/src/utils/route-test-id.ts`,
 * which builds the route-keyed test IDs of sidebar, search, TOC and guide entries. It is copied
 * rather than imported because that package's entry point pulls in Next.js and the whole Nextra
 * layout, neither of which can load inside a Playwright worker.
 */
export const getRouteTestIdSegment = (route: string): string =>
    route
        .replace(/[^a-z0-9]+/gi, '-')
        .replace(/^-+|-+$/g, '')
        .toLowerCase() || 'index';
