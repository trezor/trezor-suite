import {
    type GetNetwork,
    type GetNetworkBackendDep,
    createGetNetwork,
    createNetworkFamiliesCompositionRoot,
} from '@suite-common/networks';

import { type PopupConnectDeps, createPopupConnect } from './createPopupConnect';

export type PopupGetNetworkDeps = PopupConnectDeps & GetNetworkBackendDep;

export type PopupGetNetwork = GetNetwork;

/**
 * The app's networks for a request made by `source`: the same families, on the backend the user
 * configured, with the device reachable only through the popup. Whatever a network's capability
 * asks of the device becomes a popup call the user consents to.
 */
export const createPopupGetNetwork = (deps: PopupGetNetworkDeps): PopupGetNetwork => {
    const popupConnect = createPopupConnect(deps);

    return createGetNetwork({
        networkFamilies: createNetworkFamiliesCompositionRoot({
            getTrezorConnect: () => popupConnect,
        }),
        getNetworkBackend: deps.getNetworkBackend,
    });
};
