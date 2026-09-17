import { supportedCardanoNetworks } from '@trezor/network-cardano/constants';
import { asNetworkSymbols } from '@trezor/network-module';
import type { SuiteNetworkModule } from '@trezor/network-module-suite-types';

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
            title: 'TR_SIGN_MESSAGE',
        },
        getSupportedNetworks: () => asNetworkSymbols(supportedCardanoNetworks),
    };
};
