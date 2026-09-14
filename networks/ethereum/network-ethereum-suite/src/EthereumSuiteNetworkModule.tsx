import {
    type EthereumNetworkSymbol,
    isSupportedEthereumNetwork,
    supportedEthereumNetworks,
} from '@trezor/network-ethereum/constants';
import type { SuiteNetworkModule } from '@trezor/network-module-suite-types';

import { EthereumSignVerify } from './EthereumSignVerify';
import {
    type EthereumSignVerifyConnectDep,
    createEthereumSignVerifyActions,
} from './ethereumSignVerifyActions';

export type EthereumSuiteNetworkModuleDeps = EthereumSignVerifyConnectDep;

export type EthereumSuiteNetworkModule = SuiteNetworkModule<EthereumNetworkSymbol>;

export const createEthereumSuiteNetworkModule = (
    deps: EthereumSuiteNetworkModuleDeps,
): EthereumSuiteNetworkModule => {
    const actions = createEthereumSignVerifyActions(deps);

    return {
        signVerify: {
            Component: props => <EthereumSignVerify {...props} actions={actions} />,
            title: 'TR_NAV_SIGN_VERIFY',
        },
        getSupportedNetworks: () => supportedEthereumNetworks,
        isSupportedNetwork: isSupportedEthereumNetwork,
    };
};
