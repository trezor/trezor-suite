import { Buffer } from 'buffer';

const base64UrlToBase64 = (input: string) => {
    const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
    const pad = base64.length % 4;
    if (pad === 0) return base64;

    return base64 + '='.repeat(4 - pad);
};

const base64ToBase64Url = (input: string) =>
    input.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');

const patchBase64Url = (BufferCtor: any) => {
    if (!BufferCtor?.prototype?.toString) return;

    const originalToString = BufferCtor.prototype.toString;
    if (!BufferCtor.prototype.__trezorPatchedBase64UrlToString) {
        Object.defineProperty(BufferCtor.prototype, '__trezorPatchedBase64UrlToString', {
            value: true,
            enumerable: false,
        });
        BufferCtor.prototype.toString = function (this: any, encoding: any, start: any, end: any) {
            if (encoding === 'base64url') {
                return base64ToBase64Url(originalToString.call(this, 'base64', start, end));
            }

            return originalToString.call(this, encoding, start, end);
        };
    }

    const originalFrom = BufferCtor.from;
    if (!BufferCtor.__trezorPatchedBase64UrlFrom) {
        Object.defineProperty(BufferCtor, '__trezorPatchedBase64UrlFrom', {
            value: true,
            enumerable: false,
        });
        BufferCtor.from = function (this: any, value: any, encodingOrOffset: any, length: any) {
            if (encodingOrOffset === 'base64url' && typeof value === 'string') {
                return originalFrom.call(this, base64UrlToBase64(value), 'base64');
            }

            return originalFrom.call(this, value, encodingOrOffset, length);
        };
    }
};

// Must stay a function: a bundler may drop a module that only has side effects.
export const installBrowserPolyfills = () => {
    // Define Buffer in all possible global scopes
    if (typeof window !== 'undefined') {
        (window as any).Buffer = (window as any).Buffer || Buffer;
    }

    if (typeof global !== 'undefined') {
        global.Buffer = global.Buffer || Buffer;
    }

    if (typeof globalThis !== 'undefined') {
        globalThis.Buffer = globalThis.Buffer || Buffer;
    }

    patchBase64Url(Buffer);
    if (typeof window !== 'undefined' && (window as any).Buffer) {
        patchBase64Url((window as any).Buffer);
    }
    if (typeof global !== 'undefined' && global.Buffer) patchBase64Url(global.Buffer);
    if (typeof globalThis !== 'undefined' && globalThis.Buffer) patchBase64Url(globalThis.Buffer);

    // Make sure global is defined
    if (typeof window !== 'undefined' && typeof global === 'undefined') {
        (window as any).global = window;
    }

    // Make sure globalThis is defined
    if (typeof window !== 'undefined' && typeof globalThis === 'undefined') {
        (window as any).globalThis = window;
    }
    // Polyfill process.nextTick for jws.createVerify
    if (
        typeof window !== 'undefined' &&
        typeof (window as any).process !== 'undefined' &&
        typeof (window as any).process.nextTick === 'undefined'
    ) {
        (window as any).process.nextTick = (cb: () => void) => Promise.resolve().then(cb);
    }
};
