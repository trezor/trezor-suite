/* @flow */

export type Defered = {
  promise: Promise<void>;
  resolve: () => void;
  reject: (e: Error) => void;
};

export function create(): Defered {
  let _resolve: () => void = () => {};
  let _reject: (e: Error) => void = (e) => {};
  const promise = new Promise((resolve, reject) => {
    _resolve = resolve;
    _reject = reject;
  });
  return {
    promise,
    resolve: _resolve,
    reject: _reject,
  };
}
