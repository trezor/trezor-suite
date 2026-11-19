// The watch route carries the watched address or name, which must never be reported.
// The router also matches the route with a trailing slash.
const WATCH_ACCOUNT_ROUTE_PARAMS = /^(\/watch)\/?[?#].*$/s;

// Hides coinjoin account usage by reporting its routes as taproot ones.
export const redactRouterUrl = (url: string) =>
    url.replace(WATCH_ACCOUNT_ROUTE_PARAMS, '$1').replace(/coinjoin/g, 'taproot');
