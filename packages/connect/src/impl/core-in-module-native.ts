import { CoreInModule } from '@trezor/connect-core/src/impl/core-in-module';
import { type AbstractTransportParams, BridgeTransport } from '@trezor/transport-common';

export class CoreInModuleNative extends CoreInModule {
    // Native hosts construct their per-device-type transports themselves; Bridge stays the
    // fallback for hosts that pass none.
    protected defaultTransports(params: AbstractTransportParams) {
        return [new BridgeTransport(params)];
    }
}
