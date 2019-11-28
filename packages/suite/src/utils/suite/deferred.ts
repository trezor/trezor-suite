export interface Deferred<T> {
    id?: string;
    promise: Promise<T>;
    resolve: (t: T) => void;
    reject: (e: Error) => void;
}

export const createDeferred = <T>(): Deferred<T> => {
    let localResolve: (t: T) => void = () => {};
    let localReject: (e: Error) => void = () => {};
    // let id: string;

    const promise: Promise<T> = new Promise((resolve, reject) => {
        localResolve = resolve;
        localReject = reject;
        // if (typeof arg === 'function') {clear
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
