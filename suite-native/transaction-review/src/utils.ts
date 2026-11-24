import {
    type NetworkSymbol,
    getNetworkType,
    isNetworkWithTokens,
} from '@suite-common/wallet-config';

// Cardano totalSpent is denominated in lovelace and includes the fee, even for token transfers.
export const isNonCardanoNetworkWithTokens = (symbol: NetworkSymbol) =>
    isNetworkWithTokens(symbol) && getNetworkType(symbol) !== 'cardano';
