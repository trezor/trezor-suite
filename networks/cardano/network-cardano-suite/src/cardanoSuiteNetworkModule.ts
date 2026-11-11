import { supportedCardanoNetworks } from '@trezor/network-cardano-types';
import { type SuiteNetworkModule } from '@trezor/network-module-suite-types';
import { asNetworkSymbols } from '@trezor/network-module-types';

import { CardanoSignVerify } from './signVerify/CardanoSignVerify';

export const createCardanoSuiteNetworkModule = (): SuiteNetworkModule => ({
    getSupportedNetworks: () => asNetworkSymbols(supportedCardanoNetworks),
    // Suite only signs Cardano messages, so the page offers no verification.
    getSignVerify: () => ({ Component: CardanoSignVerify, title: 'TR_SIGN_MESSAGE' }),
});
