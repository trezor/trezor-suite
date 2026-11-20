// Hides coinjoin account usage by reporting its routes as taproot ones.
export const redactRouterUrl = (url: string) => url.replace(/coinjoin/g, 'taproot');
