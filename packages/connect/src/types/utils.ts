// TODO: https://github.com/trezor/trezor-suite/issues/4786
export type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (
    k: infer I,
) => void
    ? I
    : never;

export type MessageFactoryFn<Group, Event> = UnionToIntersection<
    Event extends { type: string }
        ? Event extends { payload: any }
            ? (
                  type: Event['type'],
                  payload: Event['payload'],
              ) => { event: Group; type: Event['type']; payload: Event['payload'] }
            : (
                  type: Event['type'],
                  payload?: undefined,
              ) => { event: Group; type: Event['type']; payload: undefined }
        : never
>;

export type CancelablePromise<T> = Promise<T> & {
    cancel: (reason?: string) => void;
    setAbortSignal: (signal: AbortSignal) => void;
};

export const CancelablePromise = {
    resolve: <T>(value: T): CancelablePromise<T> => {
        const promise = Promise.resolve(value) as CancelablePromise<T>;
        promise.cancel = () => {};
        promise.setAbortSignal = () => {};

        return promise;
    },
    reject: <T = never>(reason?: string): CancelablePromise<T> => {
        const promise = Promise.reject(reason) as CancelablePromise<T>;
        promise.cancel = () => {};
        promise.setAbortSignal = () => {};

        return promise;
    },
};
