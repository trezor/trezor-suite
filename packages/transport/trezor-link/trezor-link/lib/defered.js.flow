/* @flow */

"use strict";

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

  return {
    resolve: localResolve,
    reject: localReject,
    promise,
    rejectingPromise,
  };
}
