// return type of ./proxy-generator

export type IpcProxyGenerator<T> = (
    channelName: string,
    ...constructorParams: any[]
) => Promise<{
    target: T;
    proxy: {
        get(target: T, p: string | symbol): any;
    };
}>;

export type IpcProxyApi = {
    create: (channelName: string, instanceId: string, constructorParams: any) => Promise<any>;
    request: (channelName: string, instanceId: string, method: string, args: any[]) => Promise<any>;
    setHandler: (channelName: string, instanceId: string, eventName: string, handler: any) => void;
    clearHandler: (channelName: string, instanceId: string, eventName: string) => void;
};

// Electron.IpcMainInvokeEvent narowed down only to properties we actually need
export interface ElectronIpcMainInvokeEvent {
    senderFrame: {
        url: string;
        isDestroyed: () => boolean;
    } | null;
}
