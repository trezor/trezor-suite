import type { CardanoNetworkSymbol } from '@trezor/network-cardano/constants';
import {
    type SuiteCommonNetworkConfig,
    asProtocol,
} from '@trezor/network-module-suite-common-types';

const networkConfigBySymbol: Readonly<Record<CardanoNetworkSymbol, SuiteCommonNetworkConfig>> = {
    ada: { color: '#3468d1', protocols: [asProtocol('cardano'), asProtocol('ada')] },
};

export const getNetworkConfig = (symbol: CardanoNetworkSymbol): SuiteCommonNetworkConfig =>
    networkConfigBySymbol[symbol];
