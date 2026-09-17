import { supportedBitcoinNetworks } from '@trezor/network-bitcoin/constants';
import { asNetworkSymbols } from '@trezor/network-module';
import type { SuiteNetworkModule } from '@trezor/network-module-suite-types';

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
            title: 'TR_NAV_SIGN_VERIFY',
        },
        getSupportedNetworks: () => asNetworkSymbols(supportedBitcoinNetworks),
    };
};
