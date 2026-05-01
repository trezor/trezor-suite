/**
 * Structural types for the WebUSB-shaped interface that {@link UsbApi} consumes.
 *
 * Defining them locally (instead of relying on the `USB` / `USBDevice` ambient
 * globals from `@types/w3c-web-usb`) keeps the package's public `.d.ts` free of
 * DOM lib references, so node consumers don't pick up browser USB types just
 * because they import from `@trezor/transport`.
 *
 * Both `navigator.usb` (browser) and `new WebUSB(...)` from the node `usb`
 * package satisfy these shapes structurally.
 */

export interface UsbInTransferResultLike {
    status?: string;
    data?: { byteLength: number; buffer: ArrayBufferLike };
}

export interface UsbOutTransferResultLike {
    status: string;
    bytesWritten?: number;
}

export interface UsbInterfaceLike {
    interfaceNumber: number;
    claimed: boolean;
}

export interface UsbConfigurationLike {
    configurationValue: number;
    interfaces: UsbInterfaceLike[];
}

export interface UsbDeviceLike {
    /**
     * The WebUSB spec types these as `string | null` (returned as `null`
     * when unavailable). `undefined` is also accepted because some node
     * polyfills omit the field entirely, and structural typing requires us
     * to be at least as wide as both producers.
     */
    productName?: string | null;
    manufacturerName?: string | null;
    serialNumber?: string | null;
    vendorId: number;
    productId: number;
    deviceVersionMajor: number;
    deviceVersionMinor: number;
    opened: boolean;
    configuration: UsbConfigurationLike | null;

    open(): Promise<void>;
    close(): Promise<void>;
    selectConfiguration(configurationValue: number): Promise<void>;
    claimInterface(interfaceNumber: number): Promise<void>;
    releaseInterface(interfaceNumber: number): Promise<void>;
    reset(): Promise<void>;
    transferIn(endpointNumber: number, length: number): Promise<UsbInTransferResultLike>;
    transferOut(endpointNumber: number, data: BufferSource): Promise<UsbOutTransferResultLike>;
}

export interface UsbConnectionEventLike {
    device: UsbDeviceLike;
}

/**
 * Callback parameter is intentionally typed as `any` so both the browser
 * `(ev: USBConnectionEvent) => any` and node-usb's compatible signature
 * can be assigned in via structural typing. The full DOM `Event` shape
 * (with `bubbles`, `cancelable`, …) would otherwise force consumers to
 * pull in the `lib.dom` types, which is exactly what this module exists
 * to avoid. Internal usage only reads `event.device`.
 */
type UsbConnectionListener = ((event: any) => void) | null;

export interface UsbInterfaceApi {
    getDevices(): Promise<UsbDeviceLike[]>;
    onconnect: UsbConnectionListener;
    ondisconnect: UsbConnectionListener;
}
