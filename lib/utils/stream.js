/* @flow
 */

// We didn't find any Stream library that would be flow-typed and that we liked.
// So we made our own library for emitters and streams, that was supposed to be simple...
//
// ... well it got big over time. So here it is.
//
// We are probably reinventing the wheel here. But it is OUR wheel.

import { deferred } from './deferred';

type Handler<T> = (value: T, detach: () => void) => void;
type Listener<T> = {
    handler: Handler<T>,
    detached: boolean,
};

// const MAX_LISTENERS = 50;
export class Emitter<T> {
    listeners: Array<Listener<T>>;

    constructor() {
        this.listeners = [];
    }

    destroy() {
        this.listeners.forEach(listener => this.detach(listener.handler));
        this.listeners = [];
    }

    // `attach` doesn't affect currently running `emit`, so listeners are not
    // modified in place.
    attach(handler: Handler<T>) {
        this.listeners = this.listeners.concat([{
            handler,
            detached: false,
        }]);
        // if (this.listeners.length > MAX_LISTENERS) {
        //     throw new Error('Too many listeners. Memory leak?');
        // }
    }

    // `detach` does affect the `emit` cycle, we mark the listener as `detached`
    // so it can be ignored right away.
    detach(handler: Handler<T>) {
        this.listeners = this.listeners.filter((listener) => {
            if (listener.handler === handler) {
                listener.detached = true;
                return false;
            } else {
                return true;
            }
        });
    }

    emit(value: T) {
        this.listeners.forEach((listener) => {
            if (!listener.detached) {
                listener.handler(value, () => {
                    this.detach(listener.handler);
                });
            }
        });
    }
}

type Taker<T> = (value: T) => void;

export class Queue<T> {
    buffer: Array<T>;
    takers: Array<Taker<T>>;

    constructor() {
        this.buffer = [];
        this.takers = [];
    }

    put(value: T) {
        this.buffer.push(value);
        this.shift();
    }

    take(taker: Taker<T>) {
        this.takers.push(taker);
        this.shift();
    }

    shift() {
        if (this.buffer.length > 0 && this.takers.length > 0) {
            const value = this.buffer.shift();
            const taker = this.takers.shift();
            taker(value);
        }
    }
}

export type Disposer = () => void;
type Finisher = () => void;
type Updater<T> = (value: T) => void;
type Controller<T> = (update: Updater<T>, finish: Finisher) => Disposer;

export class Stream<T> {
    values: Emitter<T>;
    finish: Emitter<void>;
    dispose: Disposer;

    static fromEmitter<T>(
        emitter: Emitter<T>,
        dispose: () => void
    ): Stream<T> {
        return new Stream((update, finish) => {
            let disposed = false;
            const handler = (t) => {
                if (!disposed) {
                    update(t);
                }
            };
            emitter.attach(handler);
            return () => {
                disposed = true;
                emitter.detach(handler);
                dispose();
            };
        });
    }

    static fromEmitterFinish<T>(
        emitter: Emitter<T>,
        finisher: Emitter<void>,
        dispose: () => void
    ): Stream<T> {
        return new Stream((update, finish) => {
            let disposed = false;
            const handler = (t) => {
                if (!disposed) {
                    update(t);
                }
            };
            emitter.attach(handler);
            finisher.attach((nothing, detach) => {
                finish();
                detach();
                emitter.detach(handler);
            });
            return () => {
                disposed = true;
                emitter.detach(handler);
                dispose();
            };
        });
    }

    static fromArray<T>(
        array: Array<T>
    ): Stream<T> {
        return new Stream((update, finish) => {
            let disposed = false;
            setTimeout(() => {
                if (!disposed) {
                    array.forEach(t => {
                        update(t);
                    });
                    finish();
                }
            }, 0);
            return () => {
                disposed = true;
            };
        });
    }

    static fromPromise<T>(
        promise: Promise<Stream<T>>
    ): Stream<T> {
        return new Stream((update, finish) => {
            let stream_;
            let disposed = false;
            promise.then(stream => {
                if (!disposed) {
                    stream.values.attach(v => update(v));
                    stream.finish.attach(() => finish());
                    stream_ = stream;
                }
            }, () => {
                setTimeout(
                  () => finish(), 1
                );
            });
            return () => {
                disposed = true;
                if (stream_ != null) {
                    stream_.dispose();
                }
            };
        });
    }

    static generate<T>(
        initial: T,
        generate: (state: T) => Promise<T>,
        condition: (state: T) => boolean
    ): Stream<T> {
        return new Stream((update, finish) => {
            let disposed = false;
            const iterate = (state) => {
                generate(state).then((state) => {
                    if (disposed) {
                        // stop the iteration
                    } else {
                        update(state);
                        if (condition(state)) {
                            iterate(state);
                        } else {
                            finish();
                        }
                    }
                });
            };
            iterate(initial);
            return () => { disposed = true; };
        });
    }

    static setLater<T>(): {
        stream: Stream<T>,
        setter: (s: Stream<T>) => void,
    } {
        const df = deferred();
        let set = false;
        const setter = (s: Stream<T>) => {
            if (set) {
                throw new Error('Setting stream twice.');
            }
            set = true;
            df.resolve(s);
        };
        const stream = new Stream((update, finish) => {
            let s: ?Stream<T> = null;
            df.promise.then(ns => {
                s = ns;
                ns.values.attach((v) => {
                    update(v);
                });
                ns.finish.attach(() => {
                    finish();
                });
            });
            return () => {
                if (s != null) {
                    s.dispose();
                }
            };
        });
        return {stream, setter};
    }

    static simple<T>(value: T): Stream<T> {
        return new Stream((update, finish) => {
            let disposed = false;
            setTimeout(() => {
                if (!disposed) {
                    update(value);
                    setTimeout(() => {
                        if (!disposed) {
                            finish();
                        }
                    }, 1);
                }
            }, 1);
            return () => {
                disposed = true;
            };
        });
    }

    static combine<T>(streams: Array<Stream<T>>): Stream<Array<T>> {
        return new Stream((update, finish) => {
            const combined = new Array(streams.length);
            const updated = new Set();
            const finished = new Set();
            streams.forEach((s, i) => {
                s.values.attach((v) => {
                    combined[i] = v;
                    updated.add(i);
                    if (updated.size >= streams.length) {
                        update(combined);
                    }
                });
                s.finish.attach(() => {
                    finished.add(i);
                    if (finished.size >= streams.length) {
                        finish();
                    }
                });
            });
            return () => {
                streams.forEach((s) => s.dispose());
            };
        });
    }

    static combineFlat<T>(streams: Array<Stream<T>>): Stream<T> {
        return new Stream((update, finish) => {
            const finished = new Set();
            streams.forEach((s, i) => {
                s.values.attach((v) => {
                    update(v);
                });
                s.finish.attach(() => {
                    finished.add(i);
                    if (finished.size >= streams.length) {
                        finish();
                    }
                });
            });
            return () => {
                streams.forEach((s) => s.dispose());
            };
        });
    }

    static filterNull<T>(
        stream: Stream<?T>
    ): Stream<T> {
        return new Stream((update, finish) => {
            stream.values.attach((value) => {
                if (value != null) {
                    update(value);
                }
            });
            stream.finish.attach(finish);
            return stream.dispose;
        });
    }

    constructor(controller: Controller<T>) {
        this.values = new Emitter();
        this.finish = new Emitter();
        this.dispose = controller(
            (value) => { this.values.emit(value); },
            () => { this.finish.emit(); }
        );
    }

    awaitFirst(): Promise<T> {
        return new Promise((resolve, reject) => {
            let onFinish = () => {};
            const onValue = (value) => {
                this.values.detach(onValue);
                this.finish.detach(onFinish);
                resolve(value);
            };
            onFinish = () => {
                this.values.detach(onValue);
                this.finish.detach(onFinish);
                reject(new Error('No first value.'));
            };
            this.values.attach(onValue);
            this.finish.attach(onFinish);
        });
    }

    awaitFinish(): Promise<void> {
        return new Promise((resolve) => {
            const onFinish = (finish) => {
                this.finish.detach(onFinish);
                resolve();
            };
            this.finish.attach(onFinish);
        });
    }

    awaitLast(): Promise<T> {
        return new Promise((resolve, reject) => {
            let lastValue;
            const onValue = (value) => { lastValue = value; };
            const onFinish = (finish) => {
                this.values.detach(onValue);
                this.finish.detach(onFinish);
                if (lastValue == null) {
                    reject(new Error('No last value.'));
                } else {
                    resolve(lastValue);
                }
            };
            this.values.attach(onValue);
            this.finish.attach(onFinish);
        });
    }

    map<U>(fn: (value: T) => U): Stream<U> {
        return new Stream((update, finish) => {
            this.values.attach((value) => { update(fn(value)); });
            this.finish.attach(finish);
            return this.dispose;
        });
    }

    // note: this DOES keep the order
    mapPromise<U>(fn: (value: T) => Promise<U>): Stream<U> {
        return new Stream((update, finish) => {
            let previous: Promise<any> = Promise.resolve();
            let disposed = false;
            this.values.attach((value) => {
                const previousNow = previous;
                previous = fn(value).then(u => {
                    previousNow.then(() => {
                        if (!disposed) {
                            update(u);
                        }
                    });
                });
            });
            this.finish.attach(() => {
                previous.then(() => finish());
            });
            return () => {
                disposed = true;
                this.dispose();
            };
        });
    }

    mapPromiseError<U>(fn: (value: T) => Promise<U>): Stream<U | Error> {
        return new Stream((update, finish) => {
            let previous: Promise<any> = Promise.resolve();
            let disposed = false;
            this.values.attach((value) => {
                const previousNow = previous;
                previous = fn(value).then(u => {
                    previousNow.then(() => {
                        if (!disposed) {
                            update(u);
                        }
                    });
                }, error => {
                    previousNow.then(() => {
                        if (!disposed) {
                            update(error);
                        }
                    });
                });
            });
            this.finish.attach(() => {
                previous.then(() => finish());
            });
            return () => {
                disposed = true;
                this.dispose();
            };
        });
    }

    filter(fn: (value: T) => boolean): Stream<T> {
        return new Stream((update, finish) => {
            this.values.attach((value) => {
                if (fn(value)) {
                    update(value);
                }
            });
            this.finish.attach(finish);
            return this.dispose;
        });
    }

    reduce<U>(fn: (previous: U, value: T) => U, initial: U): Promise<U> {
        return new Promise((resolve, reject) => {
            let state = initial;
            this.values.attach((value) => { state = fn(state, value); });
            this.finish.attach(() => { resolve(state); });
        });
    }

    concat(other: Stream<T>): Stream<T> {
        return new Stream((update, finish) => {
            let finished = 0;
            this.values.attach((value) => {
                update(value);
            });
            other.values.attach((value) => {
                update(value);
            });

            const finishOne = () => {
                finished++;
                if (finished === 2) {
                    finish();
                }
            };

            this.finish.attach(finishOne);
            other.finish.attach(finishOne);

            return () => {
                this.dispose();
                other.dispose();
            };
        });
    }
}

export class StreamWithEnding<UpdateT, EndingT> {
    stream: Stream<UpdateT>;
    ending: Promise<EndingT>; // ending never resolves before stream finishes
    dispose: (e: Error) => void;

    static fromStreamAndPromise(s: Stream<UpdateT>, ending: Promise<EndingT>): StreamWithEnding<UpdateT, EndingT> {
        const res: StreamWithEnding<UpdateT, EndingT> = new StreamWithEnding();
        res.stream = s;

        const def = deferred();
        res.dispose = (e: Error) => {
            def.reject(e);
            s.dispose();
        };
        s.awaitFinish().then(() => {
            def.resolve();
        });

        res.ending = def.promise.then(() => ending);
        return res;
    }
}
