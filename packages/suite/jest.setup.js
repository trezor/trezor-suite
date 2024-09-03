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
