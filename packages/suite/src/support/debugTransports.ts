import { type ConnectSettings, type ConnectSettingsTransport } from '@trezor/connect';
import { isWeb } from '@trezor/env-utils';
// Deep import bypasses the `@trezor/transport` barrel so browser bundlers avoid
// node-only sibling modules (`UdpTransport`/`dgram`, `NodeUsbTransport`/`usb`).
import { BridgeTransport } from '@trezor/transport/src/transports/bridge';
import { WebUsbTransport } from '@trezor/transport-web';

const mapWebDebugTransport = (transport: unknown): ConnectSettingsTransport | undefined => {
    switch (transport) {
        case 'BridgeTransport':
            return BridgeTransport;
        case 'WebUsbTransport':
            return WebUsbTransport;
        default:
            return undefined;
    }
};

// Web-only mapper for the debug-menu transport switcher. Lives in
// `packages/suite` (web/desktop app) so the shared `@suite-common/connect-init`
// never has to import `@trezor/transport-web` — that import is unsafe in the
// React Native bundle. On desktop, strings travel through IPC unchanged and are
// mapped to DI references in `@trezor/suite-desktop-core`'s main process.
export const getConnectSettingsTransports = (
    debugTransports: readonly unknown[] | undefined,
): ConnectSettings['transports'] => {
    if (!isWeb()) {
        return debugTransports as ConnectSettings['transports'];
    }

    return debugTransports
        ?.map(mapWebDebugTransport)
        .filter((transport): transport is ConnectSettingsTransport => transport !== undefined);
};
