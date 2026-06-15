import { type ConnectSettings, type ConnectSettingsTransport } from '@trezor/connect';
import { isWeb } from '@trezor/env-utils';
// Deep import bypasses the `@trezor/transport` barrel so browser bundlers avoid
// node-only sibling modules (`UdpTransport`/`dgram`, `NodeUsbTransport`/`usb`).
import { BridgeTransport } from '@trezor/transport/src/transports/bridge';
import { WebUsbTransport } from '@trezor/transport-web';

// Pure DI: connect expects ready-made Transport instances, so the host constructs
// them here. `id` becomes the Bridge session owner shown to the user; it mirrors
// the web manifest's `appName` (see packages/suite/src/support/extraDependencies.ts).
const TRANSPORT_ID = 'Trezor Suite web';

type GetConnectSettingsTransportsParams = {
    debugTransports: readonly unknown[] | undefined;
    createLogger: ConnectSettings['createLogger'];
};

const mapWebDebugTransport = (
    transport: unknown,
    createLogger: ConnectSettings['createLogger'],
): ConnectSettingsTransport | undefined => {
    const logger = createLogger?.('@trezor/transport');

    switch (transport) {
        case 'BridgeTransport':
            return new BridgeTransport({ id: TRANSPORT_ID, logger });
        case 'WebUsbTransport':
            return new WebUsbTransport({ id: TRANSPORT_ID, logger });
        default:
            return undefined;
    }
};

// Web-only mapper for the debug-menu transport switcher. Lives in
// `packages/suite` (web/desktop app) so the shared `@suite-common/connect-init`
// never has to import `@trezor/transport-web` — that import is unsafe in the
// React Native bundle. On desktop, strings travel through IPC unchanged and are
// mapped to DI references in `@trezor/suite-desktop-core`'s main process.
export const getConnectSettingsTransports = ({
    debugTransports,
    createLogger,
}: GetConnectSettingsTransportsParams): ConnectSettings['transports'] => {
    if (!isWeb()) {
        return debugTransports as ConnectSettings['transports'];
    }

    return debugTransports
        ?.map(transport => mapWebDebugTransport(transport, createLogger))
        .filter((transport): transport is ConnectSettingsTransport => transport !== undefined);
};
