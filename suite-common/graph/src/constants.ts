import { type NetworkSymbol, asNetworkSymbol } from '@suite-common/wallet-config';
import { isArrayMember } from '@trezor/utils';

// Going over 180 will broke graph in mobile app
export const NUMBER_OF_POINTS = 40;

const LOCAL_BALANCE_HISTORY_COINS = [
    asNetworkSymbol('eth'),
    asNetworkSymbol('pol'),
    asNetworkSymbol('bsc'),
    asNetworkSymbol('xrp'),
    asNetworkSymbol('arb'),
    asNetworkSymbol('avax'),
    asNetworkSymbol('base'),
    asNetworkSymbol('op'),
    asNetworkSymbol('rhc'),
    asNetworkSymbol('hype'),
    asNetworkSymbol('xlm'),
] satisfies Array<NetworkSymbol>;
export type LocalBalanceHistoryCoin = (typeof LOCAL_BALANCE_HISTORY_COINS)[number];

export const isLocalBalanceHistoryCoin = (
    symbol: NetworkSymbol,
): symbol is LocalBalanceHistoryCoin => isArrayMember(symbol, LOCAL_BALANCE_HISTORY_COINS);

// Some networks might be ignored by graph
// Solana is ignored because it takes a lot of time and network resources to get all needed history data
// Ada is ignored because it sends a lot of requests to the blockfrost API. Therefore we have temporarily disabled it.
const IGNORED_BALANCE_HISTORY_COINS = [
    asNetworkSymbol(asNetworkSymbol(asNetworkSymbol('sol'))),
    asNetworkSymbol(asNetworkSymbol('dsol')),
    asNetworkSymbol('ada'),
] satisfies Array<NetworkSymbol>;
export const isIgnoredBalanceHistoryCoin = (symbol: NetworkSymbol) =>
    isArrayMember(symbol, IGNORED_BALANCE_HISTORY_COINS);
