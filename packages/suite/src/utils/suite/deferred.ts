export interface Deferred<Response, Data = undefined> {
    data?: Data;
    promise: Promise<Response>;
    resolve: (t: Response) => void;
    reject: (e: Error) => void;
}

export const createDeferred = <Response = void, Data = undefined>(
    data?: Data,
): Deferred<Response, Data> => {
    let localResolve: (t: Response) => void = () => {};
    let localReject: (e: Error) => void = () => {};

    const promise: Promise<Response> = new Promise((resolve, reject) => {
        localResolve = resolve;
        localReject = reject;
    });

    return {
        data,
        resolve: localResolve,
        reject: localReject,
        promise,
    };
};
