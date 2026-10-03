import { supportedCardanoNetworks } from '@trezor/network-cardano/constants';
import {
    type SuiteCommonNetworkModule,
    createNetworkModule,
} from '@trezor/network-module-suite-common-types';

import { cardanoIcon } from '../icons';
import { adaValidator } from './addressValidator/cardanoAddressValidator';
import { getAccountSyncInterval, getNetworkConfig } from './networkConfig';

export const createCardanoSuiteCommonNetworkModule = (): SuiteCommonNetworkModule =>
    createNetworkModule(supportedCardanoNetworks, {
        icon: cardanoIcon,
        addressValidator: adaValidator,
        getNetworkConfig,
        getAccountSyncInterval,
    });
