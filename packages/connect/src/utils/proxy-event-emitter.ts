import EventEmitter from 'events';

/**
 * ProxyEventEmitter is an EventEmitter that allows to use multiple EventEmitters as one
 * This is used in connect-web to allow switching between iframe and core-in-popup implementations
 */
export class ProxyEventEmitter implements EventEmitter {
    private eventEmitters: EventEmitter[];

    constructor(eventEmitters: EventEmitter[]) {
        this.eventEmitters = eventEmitters;
    }

    emit(eventName: string | symbol, ...args: any[]): boolean {
        this.eventEmitters.forEach(emitter => emitter.emit(eventName, ...args));

        return true;
    }

    on(eventName: string | symbol, listener: (...args: any[]) => void): this {
        this.eventEmitters.forEach(emitter => emitter.on(eventName, listener));

        return this;
    }

    off(eventName: string | symbol, listener: (...args: any[]) => void): this {
        this.eventEmitters.forEach(emitter => emitter.off(eventName, listener));

        return this;
    }

    once(eventName: string | symbol, listener: (...args: any[]) => void): this {
        this.eventEmitters.forEach(emitter => emitter.once(eventName, listener));

        return this;
    }

    addListener(eventName: string | symbol, listener: (...args: any[]) => void): this {
        this.eventEmitters.forEach(emitter => emitter.addListener(eventName, listener));

        return this;
    }

    prependListener(eventName: string | symbol, listener: (...args: any[]) => void): this {
        this.eventEmitters.forEach(emitter => emitter.prependListener(eventName, listener));

        return this;
    }

    prependOnceListener(eventName: string | symbol, listener: (...args: any[]) => void): this {
        this.eventEmitters.forEach(emitter => emitter.prependOnceListener(eventName, listener));

        return this;
    }

    removeAllListeners(event?: string | symbol | undefined): this {
        this.eventEmitters.forEach(emitter => emitter.removeAllListeners(event));

        return this;
    }

    removeListener(eventName: string | symbol, listener: (...args: any[]) => void): this {
        this.eventEmitters.forEach(emitter => emitter.removeListener(eventName, listener));

        return this;
    }

    setMaxListeners(n: number): this {
        this.eventEmitters.forEach(emitter => emitter.setMaxListeners(n));

        return this;
    }

    // for the following methods, we just use the first EventEmitter
    // since all EventEmitters should be in sync, the result should be the same
    eventNames(): (string | symbol)[] {
        return this.eventEmitters[0].eventNames();
    }

    getMaxListeners(): number {
        return this.eventEmitters[0].getMaxListeners();
    }

    listenerCount(eventName: string | symbol, listener?: FunctionConstructor | undefined) {
        return this.eventEmitters[0].listenerCount(eventName, listener);
    }

    rawListeners(eventName: string | symbol) {
        return this.eventEmitters[0].rawListeners(eventName);
    }

    listeners(eventName: string | symbol) {
        return this.eventEmitters[0].listeners(eventName);
    }
}
