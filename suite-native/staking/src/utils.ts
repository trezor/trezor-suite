import { NetworkSymbol } from '@suite-common/wallet-config';

const stakingCoins = ['eth', 'thol', 'tsep'] as const satisfies NetworkSymbol[];
type NetworkSymbolWithStaking = (typeof stakingCoins)[number];

export const doesCoinSupportStaking = (
    symbol: NetworkSymbol,
): symbol is NetworkSymbolWithStaking => {
    return stakingCoins.includes(symbol as any);
};
