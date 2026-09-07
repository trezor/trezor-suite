import { createNetworksCompositionRoot, registerNetworkServices } from '@suite-common/networks';
import TrezorConnect from '@trezor/connect';

// Bootstrap before importing legacy wallet-config consumers, which read configuration at module scope.
export const networkServices = createNetworksCompositionRoot({
    getTrezorConnect: () => TrezorConnect,
});

registerNetworkServices(networkServices);
