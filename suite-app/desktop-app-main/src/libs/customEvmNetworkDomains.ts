// Unparsable URLs are skipped here and rejected by the method's own validation.
export const getCustomEvmNetworkRpcHostnames = (rpcUrls: string[]) =>
    rpcUrls.flatMap(url => {
        try {
            return [new URL(url).hostname];
        } catch {
            return [];
        }
    });
