import { supportedCardanoNetworks } from '@trezor/network-cardano-types';
import type { SuiteNetworkModule } from '@trezor/network-module-suite-types';
import { asNetworkSymbols } from '@trezor/network-module-types';

import { CardanoSignVerify } from './CardanoSignVerify';
import {
    type CardanoSignVerifyConnectDep,
    createCardanoSignVerifyActions,
} from './cardanoSignVerifyActions';

export type CardanoSuiteNetworkModuleDeps = CardanoSignVerifyConnectDep;

export const createCardanoSuiteNetworkModule = (
    deps: CardanoSuiteNetworkModuleDeps,
): SuiteNetworkModule => {
    const actions = createCardanoSignVerifyActions(deps);

    return {
        signVerify: {
            Component: props => <CardanoSignVerify {...props} actions={actions} />,
            // Cardano signs but cannot verify, so the page never claims otherwise.
            canVerify: false,
        },
        getSupportedNetworks: () => asNetworkSymbols(supportedCardanoNetworks),
    };
};
