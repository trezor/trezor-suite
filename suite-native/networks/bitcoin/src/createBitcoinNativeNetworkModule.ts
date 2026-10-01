import type { SuiteNativeNetworkModule } from '@suite-native/network-module-suite-native-types';
import { supportedBitcoinNetworks } from '@trezor/network-bitcoin/constants';
import { asNetworkSymbols } from '@trezor/network-module-types';

import { BitcoinSendForm } from './components/BitcoinSendForm';

type BitcoinNativeNetworkModule = SuiteNativeNetworkModule;

const supportedNetworkSymbols = asNetworkSymbols(supportedBitcoinNetworks);

export const createBitcoinNativeNetworkModule = (): BitcoinNativeNetworkModule => ({
    getSupportedNetworks: () => supportedNetworkSymbols,
    getSendForm: () => BitcoinSendForm,
    accountDetailBanners: [],
});
