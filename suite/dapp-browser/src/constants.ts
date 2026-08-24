// EIP-1193 provider error codes and JSON-RPC 2.0 error codes used across the
// dApp-browser router, so the provider, router and host all agree on semantics.

/** EIP-1193 / EIP-1474 / EIP-3326 error codes. */
export const RPC_ERROR = {
    /** EIP-1193: user rejected the request. */
    USER_REJECTED: 4001,
    /** EIP-1193: requested method/account not authorized. */
    UNAUTHORIZED: 4100,
    /** EIP-1193: method not supported by the provider. */
    UNSUPPORTED_METHOD: 4200,
    /** EIP-1193: provider disconnected. */
    DISCONNECTED: 4900,
    /** EIP-1193: provider not connected to the requested chain. */
    CHAIN_DISCONNECTED: 4901,
    /** EIP-3326: the chain has not been added to the wallet. */
    UNRECOGNIZED_CHAIN: 4902,
    /** JSON-RPC: invalid method parameters. */
    INVALID_PARAMS: -32602,
    /** JSON-RPC: method not found. */
    METHOD_NOT_FOUND: -32601,
    /** JSON-RPC: internal error. */
    INTERNAL_ERROR: -32603,
} as const;

export type RpcErrorCode = (typeof RPC_ERROR)[keyof typeof RPC_ERROR];

/** Shape of an error returned to the dApp through the provider. */
export type ProviderRpcError = {
    code: number;
    message: string;
    data?: unknown;
};

export const createProviderError = (
    code: number,
    message: string,
    data?: unknown,
): ProviderRpcError => ({ code, message, ...(data !== undefined ? { data } : {}) });

/** EIP-6963 provider identity announced to dApps. */
export const DAPP_BROWSER_PROVIDER_INFO = {
    name: 'Trezor Suite',
    rdns: 'io.trezor.suite',
} as const;

/** IPC channel names for the narrow, dApp-only provider bridge (host ⇄ preload). */
export const DAPP_PROVIDER_IPC = {
    /** dApp → host: an EIP-1193 request (fire-and-forget, correlated by requestId). */
    REQUEST: 'dapp-browser/provider-request',
    /** host → dApp: the response to a request, sent via the WebContents so it is
     *  never tied to a frame that may have navigated/reloaded. */
    RESPONSE: 'dapp-browser/provider-response',
    /** host → dApp: a provider event (accountsChanged, chainChanged, …). */
    EVENT: 'dapp-browser/provider-event',
} as const;
