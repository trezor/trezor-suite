import {
    type BitcoinNetworkSymbol,
    isSupportedBitcoinNetwork,
    supportedBitcoinNetworks,
} from '@trezor/network-bitcoin/constants';
import type { SuiteNetworkModule } from '@trezor/network-module-suite-types';

import { BitcoinSignVerify } from './BitcoinSignVerify';
import {
    type BitcoinSignVerifyConnectDep,
    createBitcoinSignVerifyActions,
} from './bitcoinSignVerifyActions';

export type BitcoinSuiteNetworkModuleDeps = BitcoinSignVerifyConnectDep;

export type BitcoinSuiteNetworkModule = SuiteNetworkModule<BitcoinNetworkSymbol>;

export const createBitcoinSuiteNetworkModule = (
    deps: BitcoinSuiteNetworkModuleDeps,
): BitcoinSuiteNetworkModule => {
    const actions = createBitcoinSignVerifyActions(deps);

    return {
        signVerify: {
            Component: props => <BitcoinSignVerify {...props} actions={actions} />,
            title: 'TR_NAV_SIGN_VERIFY',
        },
        getSupportedNetworks: () => supportedBitcoinNetworks,
        isSupportedNetwork: isSupportedBitcoinNetwork,
    };
};
