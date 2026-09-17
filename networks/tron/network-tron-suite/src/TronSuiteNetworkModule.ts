import { asNetworkSymbols } from '@trezor/network-module';
import type { SuiteNetworkModule } from '@trezor/network-module-suite-types';
import { supportedTronNetworks } from '@trezor/network-tron/constants';

export const createTronSuiteNetworkModule = (): SuiteNetworkModule => ({
    signVerify: null,
    getSupportedNetworks: () => asNetworkSymbols(supportedTronNetworks),
});
