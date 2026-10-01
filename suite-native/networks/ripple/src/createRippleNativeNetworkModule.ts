import {
    type SuiteNativeNetworkModule,
    createNativeNetworkSendModule,
} from '@suite-native/network-module-suite-native-types';
import { asNetworkSymbols } from '@trezor/network-module-types';
import { supportedRippleNetworks } from '@trezor/network-ripple/constants';
import {
    createRippleSendStrategy,
    rippleNetworkConfiguration,
} from '@trezor/network-ripple-suite-common';

import { RippleDestinationTagField } from './components/RippleDestinationTagField';

type RippleNativeNetworkModule = SuiteNativeNetworkModule;

const supportedNetworkSymbols = asNetworkSymbols(supportedRippleNetworks);

/** Ripple has one fixed fee, so the declaration asks for no fee selector. */
export const createRippleNativeNetworkModule = (): RippleNativeNetworkModule => ({
    getSupportedNetworks: () => supportedNetworkSymbols,
    send: createNativeNetworkSendModule(rippleNetworkConfiguration, {
        send: {
            strategy: createRippleSendStrategy(),
            fields: { destinationTag: RippleDestinationTagField },
        },
    }),
    accountDetailBanners: [],
});
