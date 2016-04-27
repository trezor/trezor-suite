/* @flow
 * Typed delayed iterable
 */

export class PromiseIterable<T> {
    iterator: () => PromiseIterator<T>;
    constructor(iteratorFn: () => () => PromiseIteratorResult<T>) {
        this.iterator = () => { return {next: iteratorFn()} };
    }

    static fromIterable(source: Iterable<T>): PromiseIterable<T> {
        return new PromiseIterable(() => {
            /* $FlowIssue - missing API in flow*/
            let state: Iterator<T> = source[Symbol.iterator]();
            return () => {
                let next = state.next(); 
                let nvalue = next.value;
                /* $FlowIssue
                 * Cannot discriminate based on next.done, and I don't want to 
                 * add (nvalue == null) ? new Value(nvalue) : null, 
                 * since I want to allow T to be nullable
                 */
                let value: ?Value<T> = next.done ? null : new Value(nvalue);
                return Promise.resolve(value);
            };
        });
    }

    static fromRange(size: number): PromiseIterable<number> {
        return new PromiseIterable(() => {
            let state = -1;
            return () => {
                state++;
                if (state < size) {
                    return Promise.resolve(new Value(state));
                } else {
                    return Promise.resolve(null);
                }
            };
        });
    }


    static fromGenerator(
        initial: T,
        generate: (state: T) => Promise<T>,
        condition: (state: T) => boolean
    ): PromiseIterable<T> {
        return new PromiseIterable(() => {
            let state: Promise<T> = Promise.resolve(initial);
            let isLast = false;
            return () => {
                if (isLast) {
                    return Promise.resolve(null);
                }
                return state.then((prev: T): Promise<?Value<T>> => {
                    state = generate(prev);
                    const res: Promise<?Value<T>> = state.then((next: T): ?Value<T> => {
                        isLast = !condition(next);
                        return new Value(next);
                    })
                    return res;
                })
            }
        });
    }

    resolveAllWhile(condition: () => boolean): Promise {
        let iterator = this.iterator();
        let next = () => {
            if (!condition()) {
                return Promise.resolve();
            }
            return iterator.next().then(value => {
                if (value == null) {
                    return;
                } else {
                    return next();
                }
            });
        };
        return next();
    }

    resolveAll(): Promise {
        return this.resolveAllWhile(() => true);
    }

    map<U>(fn: (t: T) => U): PromiseIterable<U> {
        return new PromiseIterable(() => {
            let state: PromiseIterator<T> = this.iterator();
            return () => {
                return state.next().then((value) => {
                    if (value != null) {
                        return new Value(fn(value.value));
                    } else {
                        return null;
                    }
                });
            };
        });
    }

    mapPromise<U>(fn: (t: T) => Promise<U>): PromiseIterable<U> {
        return new PromiseIterable(() => {
            let state: PromiseIterator<T> = this.iterator();
            return () => {
                return state.next().then((value) => {
                    if (value != null) {
                        return fn(value.value).then(r => new Value(r));
                    } else {
                        return null;
                    }
                });
            };
        });
    }

    static flatten(arrays: PromiseIterable<Array<T>>): PromiseIterable<T> {
        return new PromiseIterable(() => {
            let state: PromiseIterator<Array<T>> = arrays.iterator();
            let lastArr: Array<T> = [];
            return () => {
                if (lastArr.length !== 0) {
                    return Promise.resolve(new Value(lastArr.shift()));
                }
                let fun = () => state.next().then((array) => {
                    if (array != null) {
                        if (!(array.value instanceof Array)) {
                            throw new Error('Cannot flatten non-array');
                        }
                        if (array.value.length === 0) {
                            return fun();
                        } else {
                            lastArr.push(...array.value);
                            return new Value(lastArr.shift());
                        }
                    } else {
                        return null;
                    }
                });
                return fun();
            };
        });
    }

    static fromPromise<T>(promise: Promise<PromiseIterable<T>>): PromiseIterable<T> {
        return new PromiseIterable(() => {
            let state: ?PromiseIterator<T> = null;
            return () => {
                if (state == null) {
                    return promise.then(iterable => {
                        state = iterable.iterator();
                        return state.next();
                    })
                } else {
                    return state.next();
                }
            };
        });
    }

    chunk(size: number): PromiseIterable<Array<T>> {
        return new PromiseIterable(() => {
            let state: PromiseIterator<T> = this.iterator();
            let last: boolean = false;
            return () => {
                let arr = [];
                if (last) {
                    return Promise.resolve(null);
                }
                let fun = () => state.next().then((value) => {
                    if (value != null) {
                        arr.push(value.value);
                        if (arr.length != size) {
                            return fun()
                        } else {
                            let res = new Value(arr);
                            arr = [];
                            return res;
                        }
                    } else {
                        if (arr.length == 0) {
                            return null;
                        } else {
                            last = true;
                            return new Value(arr);
                        }
                    }
                });
                return fun();
            }
        });
    }
}

class Value<T> {
    value: T;
    constructor(value: T) {
        this.value = value;
    }
}
type PromiseIteratorResult<T> = Promise<?Value<T>>

type PromiseIterator<T> = {
    next(): PromiseIteratorResult<T>;
}
