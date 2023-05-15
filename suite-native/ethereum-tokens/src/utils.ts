import { G, S } from '@mobily/ts-belt';

import { ethereumTokenIcons, EthereumTokenIconName } from '@trezor/icons';
import { TokenSymbol } from '@suite-common/wallet-types';

export const getEthereumTokenIconName = (symbol: TokenSymbol) => {
    if (!symbol) return 'erc20';

    const lowerCaseSymbol = symbol.toLowerCase();
    return (
        lowerCaseSymbol in ethereumTokenIcons ? lowerCaseSymbol : 'erc20'
    ) as EthereumTokenIconName;
};

export const getEthereumTokenName = (tokenName?: string) => {
    if (G.isNullable(tokenName) || S.isEmpty(tokenName)) return 'Unknown token';

    return tokenName;
};
