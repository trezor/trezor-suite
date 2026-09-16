// Guards the "true isolation" invariant: importing @trezor/transport must NOT load a usb native
// addon at module-evaluation time. NodeUsbTransport must load the addon lazily (a dynamic import()
// on first use), never at the module top level - otherwise the desktop-main webpack UMD bundle
// hoists require('usb') to process startup and a broken/missing nusb binary crashes the app before
// the legacy escape hatch can run. This test fails the instant a top-level `import ... from 'usb'`
// (or 'usb-legacy') is reintroduced anywhere reachable from the @trezor/transport barrel.
const mockAddonLoaded = { value: false };
jest.mock('usb', () => {
    mockAddonLoaded.value = true;

    return { WebUSB: class {} };
});
jest.mock('usb-legacy', () => {
    mockAddonLoaded.value = true;

    return { WebUSB: class {} };
});

describe('NodeUsbTransport startup isolation', () => {
    it('evaluating the @trezor/transport barrel does not load a usb native addon', async () => {
        // The package barrel re-exports NodeUsbTransport, so importing it evaluates nodeusb.ts.
        await import('../index');

        expect(mockAddonLoaded.value).toBe(false);
    });
});
