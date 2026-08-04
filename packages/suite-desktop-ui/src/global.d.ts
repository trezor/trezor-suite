type TrezorConnectIpcChannel = (method: string, ...params: unknown[]) => Promise<unknown>;

declare global {
    var __webpack_nonce__: string | undefined;

    interface Window {
        TrezorConnectIpcChannel?: TrezorConnectIpcChannel; // Electron API
        desktopFlags?: { exposeStore?: boolean };
        cspNonce: string;
        store?: unknown;
    }
}

export {};
