// Kept apart from the custom backend of the same symbol, which `setCustomBackend` whitelists, and
// from predefined coins, as the whitelist is set before the method rejects a predefined symbol.
export const getCustomEvmNetworkWhitelistKey = (symbol: string) => `custom-evm-network/${symbol}`;

const getHostname = (url: unknown) => {
    try {
        return typeof url === 'string' ? [new URL(url).hostname] : [];
    } catch {
        return [];
    }
};

// Invalid URLs are skipped here and rejected by the method's own validation.
export const getCustomEvmNetworkRpcHostnames = (rpcUrls: unknown) =>
    Array.isArray(rpcUrls) ? rpcUrls.flatMap(getHostname) : [];
