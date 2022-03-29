// REF-TODO: unify deferred with @trezor/utils
export type Deferred<T> = {
    id?: string;
    device?: any;
    promise: Promise<T>;
    resolve: (t: T) => void;
    reject: (e: Error) => void;
};

export type AsyncDeferred<T> = {
    promise: Promise<T>;
    resolve: (t: T) => void;
    reject: (e: Error) => void;
    run: (...args: any[]) => any;
};

export function create<T>(arg?: (() => Promise<void>) | string, device?: any): Deferred<T> {
    let localResolve: (t: T) => void = (_t: T) => {};
    let localReject: (e?: Error) => void = (_e?: Error) => {};
    let id: string;

    // eslint-disable-next-line no-async-promise-executor
    const promise: Promise<T> = new Promise(async (resolve, reject) => {
        localResolve = resolve;
        localReject = reject;
        if (typeof arg === 'function') {
            try {
                await arg();
            } catch (error) {
                reject(error);
            }
        }
        if (typeof arg === 'string') id = arg;
    });

    return {
        // REF-TODO
        // @ts-ignore
        id,
        device,
        resolve: localResolve,
        reject: localReject,
        promise,
    };
}

export function createAsync<T>(innerFn: (...args: any[]) => any): AsyncDeferred<T> {
    let localResolve: (t: T) => void = (_t: T) => {};
    let localReject: (e?: Error) => void = _e => {};

    const promise: Promise<T> = new Promise((resolve, reject) => {
        localResolve = resolve;
        localReject = reject;
    });

    const inner = async (): Promise<void> => {
        await innerFn();
    };

    return {
        resolve: localResolve,
        reject: localReject,
        promise,
        run: () => {
            inner();
            return promise;
        },
    };
}

export function resolveTimeoutPromise<T>(delay: number, result: T): Promise<T> {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(result);
        }, delay);
    });
}

export const rejectTimeoutPromise = (delay: number, error: Error) =>
    new Promise<any>((_resolve, reject) => {
        setTimeout(() => {
            reject(error);
        }, delay);
    });
