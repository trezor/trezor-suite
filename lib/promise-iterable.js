/* @flow
 * Typed delayed iterable
 */
import {
    List as ImmutableList
} from 'immutable';

export class PromiseIterable<T> {
    iterator: () => PromiseIterator<T>;
    constructor(iteratorFn: () => () => PromiseIteratorResult<T>) {
        this.iterator = () => { return {next: iteratorFn()}; };
    }

    // note that Immutable.js Iterable is also ES6 Iterable
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

    static fromPromiseOfIterable(source: Promise<Iterable<T>>): PromiseIterable<T> {
        return PromiseIterable.fromPromise(
            source.then(iterable => PromiseIterable.fromIterable(iterable))
        );
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

    static fromPromise<T>(promise: Promise<PromiseIterable<T>>): PromiseIterable<T> {
        return new PromiseIterable(() => {
            let state: ?PromiseIterator<T> = null;
            return () => {
                if (state == null) {
                    return promise.then(iterable => {
                        state = iterable.iterator();
                        return state.next();
                    });
                } else {
                    return state.next();
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
                    });
                    return res;
                });
            };
        });
    }

    reduce<U>(fn: (previous: U, value: T) => U, initial: U): Promise<U> {
        let iterator = this.iterator();
        let state = initial;
        let next = () => {
            return iterator.next().then(value => {
                if (value == null) {
                    return state;
                } else {
                    state = fn(state, value.value);
                    return next();
                }
            });
        };
        return next();
    }

    reducePromise<U>(fn: (previous: U, value: T) => Promise<U>, initial: U): Promise<U> {
        let iterator = this.iterator();
        let state: Promise<U> = Promise.resolve(initial);
        let next = (): Promise<U> => {
            return iterator.next().then(value => {
                if (value == null) {
                    return state;
                } else {
                    const value_: Value<T> = value;
                    return state.then((u: U) => {
                        state = fn(u, value_.value);
                        return state.then(() => {
                            return next();
                        });
                    });
                }
            }, err => {
                // if both iterator and function fails, we need to catch both for errors
                // elsewhere we get unhandled promise rejection errors for `state`
                return state.then(
                    () => { throw err; },
                    () => { throw err; }
                );
            });
        };
        return next();
    }

    resolveAll(): Promise<ImmutableList<T>> {
        return this.reduce(
            (prev: ImmutableList<T>, value: T): ImmutableList<T> => prev.push(value),
            new ImmutableList()
        );
    }

    resolveAllWhile(condition: () => boolean): Promise<any> {
        return this.reducePromise((prev: void, value: T): Promise<void> => {
            if (!(condition())) {
                return Promise.reject('CONDITION');
            }
            return Promise.resolve();
        }, undefined).catch(err => {
            if (err === 'CONDITION') {
                return;
            } else {
                throw err;
            }
        });
    }

    map<U>(fn: (t: T, i: number) => U): PromiseIterable<U> {
        let i = -1;
        return new PromiseIterable(() => {
            let state: PromiseIterator<T> = this.iterator();
            return () => {
                return state.next().then((value) => {
                    if (value != null) {
                        i++;
                        return new Value(fn(value.value, i));
                    } else {
                        return null;
                    }
                });
            };
        });
    }

    mapPromise<U>(fn: (t: T, i: number) => Promise<U>): PromiseIterable<U> {
        let i = -1;
        return new PromiseIterable(() => {
            let state: PromiseIterator<T> = this.iterator();
            return () => {
                return state.next().then((value) => {
                    if (value != null) {
                        i++;
                        return fn(value.value, i).then(r => new Value(r));
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
                        if (arr.length !== size) {
                            return fun();
                        } else {
                            let res = new Value(arr);
                            arr = [];
                            return res;
                        }
                    } else {
                        if (arr.length === 0) {
                            return null;
                        } else {
                            last = true;
                            return new Value(arr);
                        }
                    }
                });
                return fun();
            };
        });
    }

    // When my promise rejects, resulting promise rejects with error
    catchRejections(): PromiseIterable<T | Error> {
        return new PromiseIterable(() => {
            let state = this.iterator();
            return () => {
                return state.next().then(
                    (value) => {
                        return value == null ? null : new Value(value.value);
                    },
                    (error) => {
                        const typedError = error instanceof Error ? error : new Error(error);
                        return new Value(typedError);
                    }
                );
            };
        });
    }

    // Will not stop on rejections, but the resulting promise will be the first error
    resolveAllCatchRejections(): Promise<any> {
        return this.catchRejections().reduce((prev, value) => {
            if (prev instanceof Error) {
                return prev;
            }
            if (value instanceof Error) {
                return value;
            }
            return;
        }, undefined);
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
