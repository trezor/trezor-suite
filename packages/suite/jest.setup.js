require('@testing-library/jest-dom');
const { TextEncoder, TextDecoder } = require('util');

// Polyfill crypto.randomUUID for jsdom test environment
if (!globalThis.crypto?.randomUUID) {
    const { randomUUID } = require('crypto');
    globalThis.crypto.randomUUID = randomUUID;
}

Object.assign(global, { TextDecoder, TextEncoder });

// Fixes issues with Buffer instanceof Uint8Array checks relevant for Solana tests.
// See: https://github.com/solana-labs/solana-pay/issues/106#issuecomment-1713217913
const originalHasInstance = Uint8Array[Symbol.hasInstance];
Object.defineProperty(Uint8Array, Symbol.hasInstance, {
    value(potentialInstance) {
        return (
            originalHasInstance.call(this, potentialInstance) || Buffer.isBuffer(potentialInstance)
        );
    },
});

// Todo: once we are on ESM this should not be needed + the WASM import will needs to be solved in jest
jest.mock('@evolu/web', () => ({ evoluWebDeps: {} }));

Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(), // Deprecated
        removeListener: jest.fn(), // Deprecated
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
    })),
});
