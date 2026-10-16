import { supportedBitcoinNetworks } from '@trezor/network-bitcoin-types';
import type { SuiteNetworkModule } from '@trezor/network-module-suite-types';
import { asNetworkSymbols } from '@trezor/network-module-types';

import { BitcoinSignVerify } from './BitcoinSignVerify';
import {
    type BitcoinSignVerifyConnectDep,
    createBitcoinSignVerifyActions,
} from './bitcoinSignVerifyActions';

export type BitcoinSuiteNetworkModuleDeps = BitcoinSignVerifyConnectDep;

export const createBitcoinSuiteNetworkModule = (
    deps: BitcoinSuiteNetworkModuleDeps,
): SuiteNetworkModule => {
    const actions = createBitcoinSignVerifyActions(deps);

    return {
        signVerify: {
            Component: props => <BitcoinSignVerify {...props} actions={actions} />,
            canVerify: true,
        },
        getSupportedNetworks: () => asNetworkSymbols(supportedBitcoinNetworks),
    };
};
