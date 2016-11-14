/* @flow */

export type Defered<T> = {
  promise: Promise<T>;
  resolve: (t: T) => void;
  reject: (e: Error) => void;
  rejectingPromise: Promise<any>;
};

export function create<T>(): Defered<T> {
  let localResolve: (t: T) => void = (t: T) => {};
  let localReject: (e?: ?Error) => void = (e) => {};

  const promise = new Promise((resolve, reject) => {
    localResolve = resolve;
    localReject = reject;
  });
  const rejectingPromise = promise.then(() => {
    throw new Error(`Promise is always rejecting`);
  });
  rejectingPromise.catch(() => {});

  return {
    resolve: localResolve,
    reject: localReject,
    promise,
    rejectingPromise,
  };
}

export function resolveTimeoutPromise<T>(delay: number, result: T): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(result);
    }, delay);
  });
}

export function rejectTimeoutPromise(delay: number, error: Error): Promise<any> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      reject(error);
    }, delay);
  });
}
