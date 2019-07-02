export function create<T>(id: number | string): Deferred<T> {
    let localResolve: (t: T) => void = () => {};
    let localReject: (e?: Error) => void = () => {};

    const promise: Promise<T> = new Promise(async (resolve, reject) => {
        localResolve = resolve;
        localReject = reject;
    });

    return {
        id,
        resolve: localResolve,
        reject: localReject,
        promise,
    };
}

export type Deferred<T> = {
    id: number | string,
    promise: Promise<T>,
    resolve: (t: T) => void,
    reject: (e: Error) => void,
};
