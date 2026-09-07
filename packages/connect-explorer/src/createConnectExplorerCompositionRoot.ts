import { createNetworksCompositionRoot, registerNetworkServices } from '@suite-common/networks';
import TrezorConnect from '@trezor/connect-web';

export const createConnectExplorerCompositionRoot = () => {
    // Explorer delegates Connect calls to Suite instead of bundling the in-process Connect core.
    const networks = createNetworksCompositionRoot({
        getTrezorConnect: () => TrezorConnect,
    });
    registerNetworkServices(networks);

    return { networks };
};
