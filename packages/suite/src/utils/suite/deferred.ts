export interface Deferred<T> {
    id?: string;
    promise: Promise<T>;
    resolve: (t: T) => void;
    reject: (e: Error) => void;
}

export const createDeferred = <T>(): Deferred<T> => {
    let localResolve: (t: T) => void = (_t: T) => {};
    let localReject: (e: Error) => void = (_e: Error) => {};
    // let id: string;

    const promise: Promise<T> = new Promise(async (resolve, reject) => {
        localResolve = resolve;
        localReject = reject;
        // if (typeof arg === 'function') {
        //     try {
        //         await arg();
        //     } catch (error) {
        //         reject(error);
        //     }
        // }
        // if (typeof arg === 'string') id = arg;
    });

    return {
        id: '1',
        resolve: localResolve,
        reject: localReject,
        promise,
    };
};
