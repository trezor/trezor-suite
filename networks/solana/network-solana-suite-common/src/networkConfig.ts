import {
    type SuiteCommonNetworkConfig,
    asProtocol,
} from '@trezor/network-module-suite-common-types';

import type { SolanaNetworkSymbol } from './supportedNetworks';

const networkConfigBySymbol: Readonly<Record<SolanaNetworkSymbol, SuiteCommonNetworkConfig>> = {
    sol: { color: '#9945ff', protocols: [asProtocol('solana'), asProtocol('sol')] },
    dsol: { color: '#9945ff', protocols: [asProtocol('dsol')] },
};

export const getNetworkConfig = (symbol: SolanaNetworkSymbol): SuiteCommonNetworkConfig =>
    networkConfigBySymbol[symbol];
