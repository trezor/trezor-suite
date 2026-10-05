import { type NetworkSymbol, getNetworkType } from '@suite-common/wallet-config';
import { isNetworkWithTokens } from '@suite-native/tokens';

// Cardano totalSpent is denominated in lovelace and includes the fee, even for token transfers.
export const isNonCardanoNetworkWithTokens = (symbol: NetworkSymbol) =>
    isNetworkWithTokens(symbol) && getNetworkType(symbol) !== 'cardano';
