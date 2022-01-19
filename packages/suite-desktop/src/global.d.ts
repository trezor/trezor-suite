/// <reference path="../../suite/global.d.ts" />
/// <reference path="../../suite/styled.d.ts" />

type TrezorConnectIpcChannel = (method: string, ...params: any[]) => Promise<any>;

interface Window {
    TrezorConnectIpcChannel?: TrezorConnectIpcChannel; // Electron API
}
