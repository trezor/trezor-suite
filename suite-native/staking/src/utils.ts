import { type NetworkSymbol } from '@suite-common/wallet-config';
import { isArrayMember } from '@trezor/utils';

const stakingCoins = [
    'eth',
    'thod',
    'tsep',
    'sol',
    'dsol',
    'ada',
] as const satisfies NetworkSymbol[];
type NetworkSymbolWithStaking = (typeof stakingCoins)[number];

export const doesCoinSupportStaking = (symbol: NetworkSymbol): symbol is NetworkSymbolWithStaking =>
    isArrayMember(symbol, stakingCoins);

export const AUTO_STAKED_SYMBOLS: NetworkSymbol[] = ['ada'] as const;
