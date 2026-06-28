/**
 * Mocks `TrezorConnect.updateConnectSettings` (which `changeCoinVisibility` awaits) as a no-op
 * success, and returns the `jest.fn` spy so tests can assert how Connect was called.
 */
export const wireEnabledNetworksMock = () => {
    // Lazy-require — a top-level `import` of `@trezor/connect` would pull the protobuf decoder
    // (→ @bufbuild/protobuf) into every consumer of `@suite-common/test-utils`, breaking jsdom
    // tests that lack the TextEncoder polyfill it needs.

    const TrezorConnect = require('@trezor/connect').default;

    const updateConnectSettings = jest.fn(() =>
        Promise.resolve({ success: true, payload: { message: 'success' } }),
    );
    TrezorConnect.updateConnectSettings = updateConnectSettings;

    return { updateConnectSettings };
};
