import { NetworkSymbol } from '@suite-common/wallet-config';
import { isArrayMember } from '@trezor/utils';

// Going over 180 will broke graph in mobile app
export const NUMBER_OF_POINTS = 40;

export const LOCAL_BALANCE_HISTORY_COINS = [
    'eth',
    'pol',
    'bnb',
    'xrp',
] satisfies Array<NetworkSymbol>;
export type LocalBalanceHistoryCoin = (typeof LOCAL_BALANCE_HISTORY_COINS)[number];

export const isLocalBalanceHistoryCoin = (
    symbol: NetworkSymbol,
): symbol is LocalBalanceHistoryCoin => isArrayMember(symbol, LOCAL_BALANCE_HISTORY_COINS);

// Some networks might be ignored by graph
// Solana is ignored because it takes a lot of time and network resources to get all needed history data
export const IGNORED_BALANCE_HISTORY_COINS = ['sol'] satisfies Array<NetworkSymbol>;
export const isIgnoredBalanceHistoryCoin = (symbol: NetworkSymbol) =>
    isArrayMember(symbol, IGNORED_BALANCE_HISTORY_COINS);
