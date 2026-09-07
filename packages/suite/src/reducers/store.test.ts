it('can import the store before network services are registered', () => {
    Object.defineProperty(globalThis, 'indexedDB', { value: undefined, configurable: true });
    jest.isolateModules(() => {
        expect(() => jest.requireActual('./store')).not.toThrow();
    });
});
