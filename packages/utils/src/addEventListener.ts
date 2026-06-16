import type { Disposer } from './combineDisposers';

/**
 * Attach an EventTarget listener and get back an idempotent disposer.
 *
 * Calling the returned disposer removes the listener; subsequent calls are no-ops.
 * Works with any EventTarget — DOM globals (window, BroadcastChannel, AbortSignal,
 * MessagePort, SharedWorker port…) as well as Node's whatwg EventTarget.
 *
 * Prefer it over manual `addEventListener` + `removeEventListener` pairs whenever
 * the listener has a bounded lifetime. Combine multiple disposers via
 * `combineDisposers` to get a single cleanup callsite.
 */
export function addEventListener<K extends keyof WindowEventMap>(
    target: Window,
    type: K,
    listener: (this: Window, event: WindowEventMap[K]) => unknown,
    options?: AddEventListenerOptions | boolean,
): Disposer;
export function addEventListener<K extends keyof BroadcastChannelEventMap>(
    target: BroadcastChannel,
    type: K,
    listener: (this: BroadcastChannel, event: BroadcastChannelEventMap[K]) => unknown,
    options?: AddEventListenerOptions | boolean,
): Disposer;
export function addEventListener<K extends keyof AbortSignalEventMap>(
    target: AbortSignal,
    type: K,
    listener: (this: AbortSignal, event: AbortSignalEventMap[K]) => unknown,
    options?: AddEventListenerOptions | boolean,
): Disposer;
export function addEventListener<K extends keyof MessagePortEventMap>(
    target: MessagePort,
    type: K,
    listener: (this: MessagePort, event: MessagePortEventMap[K]) => unknown,
    options?: AddEventListenerOptions | boolean,
): Disposer;
export function addEventListener(
    target: EventTarget,
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: AddEventListenerOptions | boolean,
): Disposer;
export function addEventListener(
    target: EventTarget,
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: AddEventListenerOptions | boolean,
): Disposer {
    target.addEventListener(type, listener as EventListener, options);

    let disposed = false;

    return () => {
        if (disposed) return;
        disposed = true;
        target.removeEventListener(type, listener as EventListener, options);
    };
}
