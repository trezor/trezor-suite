import {
    type CardanoNetworkSymbol,
    isSupportedCardanoNetwork,
    supportedCardanoNetworks,
} from '@trezor/network-cardano/constants';
import type { SuiteNetworkModule } from '@trezor/network-module-suite-types';

import { CardanoSignVerify } from './CardanoSignVerify';
import {
    type CardanoSignVerifyConnectDep,
    createCardanoSignVerifyActions,
} from './cardanoSignVerifyActions';

export type CardanoSuiteNetworkModuleDeps = CardanoSignVerifyConnectDep;

export type CardanoSuiteNetworkModule = SuiteNetworkModule<CardanoNetworkSymbol>;

export const createCardanoSuiteNetworkModule = (
    deps: CardanoSuiteNetworkModuleDeps,
): CardanoSuiteNetworkModule => {
    const actions = createCardanoSignVerifyActions(deps);

    return {
        signVerify: {
            Component: props => <CardanoSignVerify {...props} actions={actions} />,
            // Cardano signs but cannot verify, so the page never claims otherwise.
            title: 'TR_SIGN_MESSAGE',
        },
        getSupportedNetworks: () => supportedCardanoNetworks,
        isSupportedNetwork: isSupportedCardanoNetwork,
    };
};
