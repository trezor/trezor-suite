import { Buffer } from 'buffer';

/**
 * Browser polyfills for bundles that boot the real Suite store: the web entry gets them injected
 * by `bufferPolyfillPlugin` in `vite.config.mts`, and the component-test gallery calls this from
 * its entry. Exposed as a function rather than as import side effects: the bundler is free to drop
 * a side-effect-only module, which would leave the entry running but `Buffer` missing.
 */
const base64UrlToBase64 = (input: string) => {
    const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
    const padding = base64.length % 4;

    return padding === 0 ? base64 : base64 + '='.repeat(4 - padding);
};

const base64ToBase64Url = (input: string) =>
    input.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');

/**
 * The `buffer` shim lacks the base64url encoding that Evolu (suite-sync) needs to create an owner.
 * Flag-guarded so a second call (e.g. an entry re-run by Vite HMR) does not wrap the patch in
 * itself.
 */
const patchBufferBase64Url = () => {
    const bufferConstructor = Buffer as typeof Buffer & { __trezorPatchedBase64Url?: boolean };
    if (bufferConstructor.__trezorPatchedBase64Url) {
        return;
    }
    bufferConstructor.__trezorPatchedBase64Url = true;

    const originalToString = Buffer.prototype.toString;
    Buffer.prototype.toString = function toStringWithBase64Url(
        encoding?: BufferEncoding,
        start?: number,
        end?: number,
    ) {
        if (encoding === 'base64url') {
            return base64ToBase64Url(originalToString.call(this, 'base64', start, end));
        }

        return originalToString.call(this, encoding, start, end);
    };

    const originalFrom = Buffer.from;
    // @ts-expect-error - the overload set is wider than the single signature we wrap
    Buffer.from = function fromWithBase64Url(
        value: unknown,
        encodingOrOffset?: unknown,
        length?: unknown,
    ) {
        if (encodingOrOffset === 'base64url' && typeof value === 'string') {
            return originalFrom.call(this, base64UrlToBase64(value), 'base64');
        }

        return (originalFrom as (...args: unknown[]) => Buffer).call(
            this,
            value,
            encodingOrOffset,
            length,
        );
    };
};

export const installBrowserPolyfills = () => {
    patchBufferBase64Url();

    globalThis.Buffer ??= Buffer;
    // `global` and `process.nextTick` are node-isms that a few browser dependencies still reach for.
    globalThis.global ??= globalThis;
    globalThis.process ??= { env: {} } as NodeJS.Process;
    globalThis.process.nextTick ??= (callback: () => void) => {
        void Promise.resolve().then(callback);
    };
};
