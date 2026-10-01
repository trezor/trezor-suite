import {
    type SuiteNativeNetworkModule,
    asNativeNetworkReducerKey,
    createNativeNetworkSendModule,
} from '@suite-native/network-module-suite-native-types';
import { type MMKVStorageDep } from '@suite-native/storage';
import { asNetworkSymbols } from '@trezor/network-module-types';
import { supportedSolanaNetworks } from '@trezor/network-solana/constants';
import {
    createSolanaSendStrategy,
    solanaNetworkConfiguration,
} from '@trezor/network-solana-suite-common';

import { SolanaLimitedHistoryBanner } from './components/SolanaLimitedHistoryBanner';
import { SolanaMemoField } from './components/SolanaMemoField';
import { SolanaPriorityFeeSelector } from './components/SolanaPriorityFeeSelector';
import { prepareSolanaReducer } from './solanaReducer';

type SolanaNativeNetworkModuleDeps = MMKVStorageDep;
type SolanaNativeNetworkModule = SuiteNativeNetworkModule;

const supportedNetworkSymbols = asNetworkSymbols(supportedSolanaNetworks);

export const createSolanaNativeNetworkModule = (
    deps: SolanaNativeNetworkModuleDeps,
): SolanaNativeNetworkModule => ({
    getSupportedNetworks: () => supportedNetworkSymbols,
    send: createNativeNetworkSendModule(solanaNetworkConfiguration, {
        send: {
            strategy: createSolanaSendStrategy(),
            fields: { memo: SolanaMemoField },
            feeSelector: SolanaPriorityFeeSelector,
        },
    }),
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
