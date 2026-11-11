import { supportedEthereumNetworks } from '@trezor/network-ethereum-types';
import { type SuiteNetworkModule } from '@trezor/network-module-suite-types';
import { asNetworkSymbols } from '@trezor/network-module-types';

import { EthereumSignVerify } from './signVerify/EthereumSignVerify';

export const createEthereumSuiteNetworkModule = (): SuiteNetworkModule => ({
    getSupportedNetworks: () => asNetworkSymbols(supportedEthereumNetworks),
    getSignVerify: () => ({ Component: EthereumSignVerify, title: 'TR_NAV_SIGN_VERIFY' }),
});
