type TrezorConnectIpcChannel = (method: string, ...params: any[]) => Promise<any>;

interface Window {
    TrezorConnectIpcChannel?: TrezorConnectIpcChannel; // Electron API
}
