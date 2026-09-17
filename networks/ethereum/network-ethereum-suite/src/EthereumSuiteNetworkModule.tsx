import { supportedEthereumNetworks } from '@trezor/network-ethereum/constants';
import { asNetworkSymbols } from '@trezor/network-module';
import type { SuiteNetworkModule } from '@trezor/network-module-suite-types';

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
            title: 'TR_NAV_SIGN_VERIFY',
        },
        getSupportedNetworks: () => asNetworkSymbols(supportedEthereumNetworks),
    };
};
