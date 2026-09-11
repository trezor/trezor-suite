import { type UpdateConnectSettings } from '@trezor/connect-common';
import { updateProxy } from '@trezor/connect-core/src/backend/BlockchainLink';
import { CoreInModule } from '@trezor/connect-core/src/impl/core-in-module';
import { NodeUsbTransport } from '@trezor/transport';
import { type AbstractTransportParams, BridgeTransport } from '@trezor/transport-common';

export class CoreInModuleNode extends CoreInModule {
    // Bridge keeps its historical preference: when trezord runs it owns the session and shows the
    // host name to the user. Node USB takes over when Bridge is not available.
    protected defaultTransports(params: AbstractTransportParams) {
        return [new BridgeTransport(params), new NodeUsbTransport(params)];
    }

    protected async updateProxy(proxy: UpdateConnectSettings['proxy']) {
        await updateProxy(proxy);
    }
}
