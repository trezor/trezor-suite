import { supportedBitcoinNetworks } from '@trezor/network-bitcoin-types';
import { type SuiteNetworkModule } from '@trezor/network-module-suite-types';
import { asNetworkSymbols } from '@trezor/network-module-types';

import { BitcoinSignVerify } from './signVerify/BitcoinSignVerify';

export const createBitcoinSuiteNetworkModule = (): SuiteNetworkModule => ({
    getSupportedNetworks: () => asNetworkSymbols(supportedBitcoinNetworks),
    getSignVerify: () => ({ Component: BitcoinSignVerify, title: 'TR_NAV_SIGN_VERIFY' }),
});
