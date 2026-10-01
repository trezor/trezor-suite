import {
    type SuiteNativeNetworkModule,
    createNativeNetworkSendModule,
} from '@suite-native/network-module-suite-native-types';
import { supportedBitcoinNetworks } from '@trezor/network-bitcoin/constants';
import {
    bitcoinNetworkConfiguration,
    createBitcoinSendStrategy,
} from '@trezor/network-bitcoin-suite-common';
import { asNetworkSymbols } from '@trezor/network-module-types';

import { BitcoinFeeRateSelector } from './components/BitcoinFeeRateSelector';

type BitcoinNativeNetworkModule = SuiteNativeNetworkModule;

const supportedNetworkSymbols = asNetworkSymbols(supportedBitcoinNetworks);

export const createBitcoinNativeNetworkModule = (): BitcoinNativeNetworkModule => ({
    getSupportedNetworks: () => supportedNetworkSymbols,
    send: createNativeNetworkSendModule(bitcoinNetworkConfiguration, {
        send: {
            strategy: createBitcoinSendStrategy(),
            fields: {},
            feeSelector: BitcoinFeeRateSelector,
        },
    }),
    accountDetailBanners: [],
});
