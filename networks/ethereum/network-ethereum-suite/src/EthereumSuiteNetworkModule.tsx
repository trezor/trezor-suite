import { supportedEthereumNetworks } from '@trezor/network-ethereum-types';
import type { SuiteNetworkModule } from '@trezor/network-module-suite-types';
import { asNetworkSymbols } from '@trezor/network-module-types';

import { EthereumSignVerify } from './EthereumSignVerify';
import {
    type EthereumSignVerifyConnectDep,
    createEthereumSignVerifyActions,
} from './ethereumSignVerifyActions';

export type EthereumSuiteNetworkModuleDeps = EthereumSignVerifyConnectDep;

export const createEthereumSuiteNetworkModule = (
    deps: EthereumSuiteNetworkModuleDeps,
): SuiteNetworkModule => {
    const actions = createEthereumSignVerifyActions(deps);

    return {
        signVerify: {
            Component: props => <EthereumSignVerify {...props} actions={actions} />,
            canVerify: true,
        },
        getSupportedNetworks: () => asNetworkSymbols(supportedEthereumNetworks),
    };
};
