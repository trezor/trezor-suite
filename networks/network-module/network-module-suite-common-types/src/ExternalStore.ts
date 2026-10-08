/**
 * State kept outside any one state library: read synchronously and observed through `subscribe`.
 * It is the shape React's `useSyncExternalStore` takes, so each platform backs it as it likes.
 */
export type ExternalStore<T> = {
    /** The same reference until the state changes. */
    getSnapshot: () => T;

    /** Calls the listener after every change; returns a function that stops it. */
    subscribe: (listener: () => void) => () => void;
};
