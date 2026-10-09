import { parseAsset } from '@trezor/blockchain-link-utils/src/blockfrost';
import { cardanoAssets } from '@trezor/network-cardano-assets';
import { supportedCardanoNetworks } from '@trezor/network-cardano-types';
import {
    type SuiteCommonNetworkModule,
    createNetworkModule,
} from '@trezor/network-module-suite-common-types';

import { adaValidator } from './addressValidator/cardanoAddressValidator';
import { createCardanoIcon } from './createCardanoIcon';
import { getAccountSyncInterval, getNetworkConfig } from './networkConfig';

export const createCardanoSuiteCommonNetworkModule = (): SuiteCommonNetworkModule =>
    createNetworkModule(supportedCardanoNetworks, {
        icon: createCardanoIcon({ cardanoAssets, parseAsset }),
        addressValidator: adaValidator,
        getNetworkConfig,
        getAccountSyncInterval,
    });
