import {
    type SuiteNativeNetworkModule,
    asNativeNetworkReducerKey,
} from '@suite-native/network-module-suite-native-types';
import { type MMKVStorageDep } from '@suite-native/storage';
import { asNetworkSymbols } from '@trezor/network-module-types';
import { supportedSolanaNetworks } from '@trezor/network-solana/constants';

import { SolanaLimitedHistoryBanner } from './components/SolanaLimitedHistoryBanner';
import { prepareSolanaReducer } from './solanaReducer';

type SolanaNativeNetworkModuleDeps = MMKVStorageDep;
type SolanaNativeNetworkModule = SuiteNativeNetworkModule;

const supportedNetworkSymbols = asNetworkSymbols(supportedSolanaNetworks);

export const createSolanaNativeNetworkModule = (
    deps: SolanaNativeNetworkModuleDeps,
): SolanaNativeNetworkModule => ({
    getSupportedNetworks: () => supportedNetworkSymbols,
    accountDetailBanners: [
        {
            id: 'solana-limited-history',
            component: SolanaLimitedHistoryBanner,
        },
    ],
    reducer: {
        key: asNativeNetworkReducerKey('solana'),
        reducer: prepareSolanaReducer(deps),
    },
});
