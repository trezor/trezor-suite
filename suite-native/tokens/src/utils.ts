import { G, S } from '@mobily/ts-belt';

import { NetworkSymbol } from '@suite-common/wallet-config';
import { isArrayMember } from '@trezor/utils';

export const getTokenName = (tokenName?: string) => {
    if (G.isNullable(tokenName) || S.isEmpty(tokenName)) return 'Unknown token';

    return tokenName;
};

export const NETWORK_SYMBOLS_WITH_TOKENS = [
    'eth',
    'pol',
    'bnb',
    'sol',
] satisfies Array<NetworkSymbol>;
export type NetworkSymbolWithTokens = (typeof NETWORK_SYMBOLS_WITH_TOKENS)[number];

export const isCoinWithTokens = (symbol: NetworkSymbol): symbol is NetworkSymbolWithTokens =>
    isArrayMember(symbol, NETWORK_SYMBOLS_WITH_TOKENS);
