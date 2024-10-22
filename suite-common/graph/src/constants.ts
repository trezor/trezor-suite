import { NetworkSymbol } from '@suite-common/wallet-config';
import { isArrayMember } from '@trezor/type-utils';

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
