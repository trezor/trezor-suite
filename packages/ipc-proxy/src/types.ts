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
    invoke: (channelName: string, instanceId: string, method: string, args: any[]) => Promise<any>;
    setHandler: (channelName: string, instanceId: string, eventName: string, handler: any) => void;
    clearHandler: (channelName: string, instanceId: string, eventName: string) => void;
};
