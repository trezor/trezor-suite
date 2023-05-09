import { G, S } from '@mobily/ts-belt';

export const getEthereumTokenName = (tokenName?: string) => {
    if (G.isNullable(tokenName) || S.isEmpty(tokenName)) return 'Unknown token';

    return tokenName;
};
