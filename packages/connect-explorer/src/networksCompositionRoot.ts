import { createNetworksCompositionRoot, registerNetworkServices } from '@suite-common/networks';
import TrezorConnect from '@trezor/connect-web';

// Explorer delegates Connect calls to Suite instead of bundling the in-process Connect core.
export const networkServices = createNetworksCompositionRoot({
    getTrezorConnect: () => TrezorConnect,
});

registerNetworkServices(networkServices);
