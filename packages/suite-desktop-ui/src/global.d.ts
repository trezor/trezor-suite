type TrezorConnectIpcChannel = (method: string, ...params: any[]) => Promise<any>;

declare global {
    var __webpack_nonce__: string | undefined;

    interface Window {
        TrezorConnectIpcChannel?: TrezorConnectIpcChannel; // Electron API
        desktopFlags?: { exposeStore?: boolean };
        cspNonce: string;
    }
}

export {};
