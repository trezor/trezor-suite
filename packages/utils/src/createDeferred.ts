export interface Deferred<Resolve = void, Arg = string | number | undefined> {
    id: Arg;
    promise: Promise<Resolve>;
    resolve: (t: Resolve) => void;
    reject: (e: Error) => void;
}

// unwrap promise response from Deferred
export type DeferredResponse<D> = D extends Deferred<infer R> ? R : never;

interface CreateDeferred {
    <Resolve = void, Arg = undefined>(id?: Arg): Deferred<Resolve, Arg>;
    <Resolve = void, Arg = string | number>(id: Arg): Deferred<Resolve, Arg>;
}

export const createDeferred: CreateDeferred = <Resolve, Arg>(id: Arg): Deferred<Resolve, Arg> => {
    let localResolve: (t: Resolve) => void = () => {};
    let localReject: (e?: Error) => void = () => {};

    const promise: Promise<Resolve> = new Promise((resolve, reject) => {
        localResolve = resolve;
        localReject = reject;
    });

    return {
        id,
        resolve: localResolve,
        reject: localReject,
        promise,
    };
};
