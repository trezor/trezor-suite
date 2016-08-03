/* @flow */

"use strict";

export type Defered = {
  promise: Promise<void>;
  resolve: () => void;
  reject: (e: Error) => void;
  rejectingPromise: Promise<any>;
};

export function create(): Defered {
  let _resolve: () => void = () => {};
  let _reject: (e: Error) => void = (e) => {};
  const promise = new Promise((resolve, reject) => {
    _resolve = resolve;
    _reject = reject;
  });
  const rejectingPromise = promise.then(() => {
    throw new Error(`Promise is always rejecting`);
  });
  return {
    promise,
    rejectingPromise,
    resolve: _resolve,
    reject: _reject,
  };
}
