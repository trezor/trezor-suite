/**
 * Turns a page route such as `/methods/bitcoin/getAddress` into the lowercase dash-separated
 * segment used by Explorer test IDs (`methods-bitcoin-getaddress`). E2E locators address sidebar,
 * search and TOC entries by their route instead of their position in the tree, so the test IDs
 * survive reordering of the navigation.
 */
export const getRouteTestIdSegment = (route: string): string =>
    route
        .replace(/[^a-z0-9]+/gi, '-')
        .replace(/^-+|-+$/g, '')
        .toLowerCase() || 'index';
