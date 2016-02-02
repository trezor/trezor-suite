/* @flow
 * Typed event emitters and data streams
 */

type Handler<T> = (value: T) => void;
type Listener<T> = {
    handler: Handler<T>;
    detached: boolean;
};

export class Emitter<T> {
    listeners: Array<Listener<T>>;

    constructor() {
        this.listeners = [];
    }

    // `attach` doesn't affect currently running `emit`, so listeners are not
    // modified in place.
    attach(handler: Handler<T>) {
        this.listeners = this.listeners.concat([{
            handler,
            detached: false,
        }]);
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
                listener.handler(value);
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
            let value = this.buffer.shift();
            let taker = this.takers.shift();
            taker(value);
        }
    }
}

type Disposer = () => void;
type Finisher = () => void;
type Updater<T> = (value: T) => void;
type Controller<T> = (update: Updater<T>, finish: Finisher) => Disposer;

export class Stream<T> {
    values: Emitter<T>;
    finish: Emitter<void>;
    dispose: Disposer;

    static generate<T>(
        initial: T,
        generate: (state: T) => Promise<T>,
        condition: (state: T) => boolean
    ): Stream<T> {
        return new Stream((update, finish) => {
            let disposed = false;
            let iterate = (state) => {
                generate(state).then((state) => {
                    if (disposed) {
                        // stop the iteration
                        return;
                    }
                    update(state);
                    if (condition(state)) {
                        iterate(state);
                    } else {
                        finish(state);
                    }
                });
            };
            iterate(initial);
            return () => { disposed = true; };
        });
    }

    constructor(controller: Controller<T>) {
        this.values = new Emitter;
        this.finish = new Emitter;
        this.dispose = controller(
            (value) => { this.values.emit(value); },
            (finish) => { this.finish.emit(finish); }
        );
    }

    awaitFirst(): Promise<T> {
        return new Promise((resolve) => {
            let onValue = (value) => {
                this.values.detach(onValue);
                resolve(value);
            };
            this.values.attach(onValue);
        });
    }

    awaitLast(): Promise<T> {
        return new Promise((resolve) => {
            let lastValue;
            let onValue = (value) => { lastValue = value; };
            let onFinish = (finish) => {
                this.values.detach(onValue);
                this.finish.detach(onFinish);
                resolve(lastValue);
            };
            this.values.attach(onValue);
            this.finish.attach(onFinish);
        });
    }

    map<V>(fn: (value: T) => V): Stream<V> {
        return new Stream((update, finish) => {
            this.values.attach((value) => update(fn(value)));
            this.finish.attach(finish);
            return this.dispose;
        });
    }
}
