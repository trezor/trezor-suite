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
