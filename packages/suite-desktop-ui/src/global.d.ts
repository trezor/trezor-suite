type TrezorConnectIpcChannel = (method: string, ...params: any[]) => Promise<any>;

interface Window {
    TrezorConnectIpcChannel?: TrezorConnectIpcChannel; // Electron API
    desktopFlags?: { exposeStore?: boolean };
}

declare global {
    interface Window {
        electronFind: {
            onShow: (callback: () => void) => void;
            offShow: (callback: () => void) => void;
        };
    }
}
