/**
 * Turns a page route such as `/methods/bitcoin/getAddress` into the lowercase dash-separated
 * segment used by Explorer test IDs (`methods-bitcoin-getaddress`). Sidebar and guide entries are
 * keyed by route, so E2E locators can address them independently of their position in the tree.
 */
export const getRouteTestIdSegment = (route: string): string =>
    route
        .replace(/[^a-z0-9]+/gi, '-')
        .replace(/^-|-$/g, '')
        .toLowerCase() || 'index';
