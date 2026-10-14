import {
    AbstractApiTransport,
    type AbstractTransportParams,
    UsbApi,
    UsbApiLegacy,
} from '@trezor/transport-common';

import { LazyUsbInterface } from './lazyUsbInterface';

// notes:
// to make it work on Linux I needed to run `sudo chmod -R 777 /dev/bus/usb/` which is obviously not
// the way to go.

export type NodeUsbTransportParams = AbstractTransportParams & {
    usbImplementation?: 'legacy' | 'nusb';
};

export class NodeUsbTransport extends AbstractApiTransport {
    public name = 'NodeUsbTransport' as const;

    constructor(params: NodeUsbTransportParams) {
        const { logger, debugLink, usbImplementation, ...rest } = params;
        // unset, or an unexpected persisted value, stays on the frozen usb 2.x path; nusb
        // must be opted into explicitly (mirrors the desktop clamp).
        const legacy = usbImplementation !== 'nusb';
        // Load the SELECTED native addon only, and only on first use (see LazyUsbInterface). Kept
        // out of a module-top-level import so that merely importing @trezor/transport never dlopens
        // a usb binary (a broken/missing addon must not crash a host that selected the other
        // implementation). The desktop-main webpack build sets externalsType 'node-commonjs' so the
        // import stays lazy instead of being hoisted into the UMD wrapper. Two literal specifiers
        // (not a computed string) avoid a webpack critical-dependency warning. Mirrors
        // @trezor/transport-bridge createCore's selection.
        const options = { allowAllDevices: true }; // return all devices, not only authorized
        const usbInterface = new LazyUsbInterface(
            legacy
                ? () => import('usb-legacy').then(({ WebUSB }) => new WebUSB(options))
                : () => import('usb').then(({ WebUSB }) => new WebUSB(options)),
        );

        super({
            api: legacy
                ? new UsbApiLegacy({ usbInterface, logger, debugLink })
                : new UsbApi({ usbInterface, logger, debugLink }),
            logger,
            ...rest,
        });
    }
}
