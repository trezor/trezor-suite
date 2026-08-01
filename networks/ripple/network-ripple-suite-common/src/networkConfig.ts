import {
    type SuiteCommonNetworkConfig,
    asProtocol,
} from '@trezor/network-module-suite-common-types';

import type { RippleNetworkSymbol } from './supportedNetworks';

const networkConfigBySymbol: Readonly<Record<RippleNetworkSymbol, SuiteCommonNetworkConfig>> = {
    xrp: { color: '#24292e', protocols: [asProtocol('ripple'), asProtocol('xrp')] },
    txrp: { color: '#e75f5f', protocols: [asProtocol('txrp')] },
};

export const getNetworkConfig = (symbol: RippleNetworkSymbol): SuiteCommonNetworkConfig =>
    networkConfigBySymbol[symbol];
