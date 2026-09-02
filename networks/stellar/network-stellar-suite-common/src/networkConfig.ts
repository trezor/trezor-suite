import {
    type SuiteCommonNetworkConfig,
    asProtocol,
} from '@trezor/network-module-suite-common-types';
import type { StellarNetworkSymbol } from '@trezor/network-stellar/constants';

const networkConfigBySymbol: Readonly<Record<StellarNetworkSymbol, SuiteCommonNetworkConfig>> = {
    xlm: { color: '#000000', protocols: [asProtocol('stellar'), asProtocol('xlm')] },
    txlm: { color: '#e75f5f', protocols: [asProtocol('txlm')] },
};

export const getNetworkConfig = (symbol: StellarNetworkSymbol): SuiteCommonNetworkConfig =>
    networkConfigBySymbol[symbol];
