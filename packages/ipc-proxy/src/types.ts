// return type of ./proxy-generator

export type IpcProxyGenerator<T> = (
    channelName: string,
    ...constructorParams: unknown[]
) => Promise<{
    target: T;
    proxy: {
        get(target: T, p: string | symbol): unknown;
    };
}>;

export type IpcProxyApi = {
    create: (
        channelName: string,
        instanceId: string,
        constructorParams: unknown,
    ) => Promise<unknown>;
    request: (
        channelName: string,
        instanceId: string,
        method: string,
        args: unknown[],
    ) => Promise<unknown>;
    setHandler: (
        channelName: string,
        instanceId: string,
        eventName: string,
        handler: (event: unknown[]) => void,
    ) => void;
    clearHandler: (channelName: string, instanceId: string, eventName: string) => void;
};

// Electron.IpcMainInvokeEvent narowed down only to properties we actually need
export interface ElectronIpcMainInvokeEvent {
    senderFrame: {
        url: string;
        isDestroyed: () => boolean;
    } | null;
}
