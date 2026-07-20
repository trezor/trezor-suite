// in-memory implementation of indexedDB as a replacement in node environment
import 'fake-indexeddb/auto';

// fake-indexeddb requires this polyfill with jsdom environment
// https://github.com/dumbmatter/fakeIndexedDB/blob/57465fd/README.md#jsdom-often-used-with-jest
import 'core-js/stable/structured-clone';

// Ensure globalThis.setImmediate uses the native Node.js implementation.
//
// Some transitive deps do `import 'setimmediate'` — the `setimmediate` npm package. In
// jsdom (Jest), native setImmediate is not on globalThis so the package installs its own
// polyfill. Even in Node.js it picks the process.nextTick-based path, but wraps it in
// bookkeeping code that batches all nextTick callbacks in the same microtask phase. This
// means microtasks (Promise .then) queued by one callback do NOT run before the next
// callback fires.
//
// fake-indexeddb relies on that interleaving: after a cursor request succeeds, the
// success event handler resolves a Promise (microtask) that lets user code call
// cursor.continue() / cursor.delete() and enqueue the next IDB request BEFORE the
// transaction's _start() runs again via setImmediate. With the polyfill, _start()
// fires first, finds no pending requests, and auto-commits — TransactionInactiveError.
//
// We retrieve the real Node.js setImmediate from the outer realm via the jsdom escape
// hatch and lock it with a non-configurable getter, so the polyfill's assignment is
// silently ignored.
const _nativeSetImmediate: typeof setImmediate | undefined = (() => {
    if (typeof navigator !== 'undefined' && /jsdom/.test(navigator.userAgent)) {
        // In jsdom (Jest) environment, retrieve native setImmediate from the outer Node.js realm.
        // This is the same escape hatch that fake-indexedDB itself uses internally.
        return new (Node.constructor as new (code: string) => { (): typeof setImmediate })(
            'return setImmediate',
        )();
    }

    if (typeof setImmediate === 'function') {
        return setImmediate;
    }

    return undefined;
})();

if (_nativeSetImmediate) {
    // Use a getter so that `globalThis.setImmediate = polyfill` (simple assignment from
    // core-js) becomes a no-op in sloppy mode and we always return the native version.
    Object.defineProperty(globalThis, 'setImmediate', {
        get() {
            return _nativeSetImmediate;
        },
        set() {
            // intentionally ignore — keep the native implementation
        },
        configurable: false,
    });
}
