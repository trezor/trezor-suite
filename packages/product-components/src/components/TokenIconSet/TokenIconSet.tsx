import { type ReactNode, useMemo } from 'react';

import { type NetworkSymbol } from '@suite-common/icons';

import { type CommonIconSetProps, IconSetBase, IconWrapper } from '../IconSet/IconSetBase';
import { type TokenIconSize } from '../TokenIcon/tokenIconTypes';

export type TokenIconSetToken = {
    contract?: string | null;
    symbol?: string;
    networkSymbol?: NetworkSymbol;
};

export type TokenIconSetProps = CommonIconSetProps & {
    symbol: NetworkSymbol;
    tokens: readonly TokenIconSetToken[];
    renderIcon: (token: TokenIconSetToken, size: TokenIconSize) => ReactNode;
};

export const TokenIconSet = ({
    symbol,
    tokens,
    size,
    gap,
    maxVisibleIcons = 3,
    isCountVisible = false,
    isCentered = false,
    isReversed = false,
    renderIcon,
}: TokenIconSetProps) => {
    const { length } = tokens;

    const visibleTokensContent = useMemo(() => {
        const visibleTokens = maxVisibleIcons !== null ? tokens.slice(0, maxVisibleIcons) : tokens;

        return visibleTokens.map(token => {
            const tokenNetworkSymbol = token.networkSymbol ?? symbol;
            const key = `${tokenNetworkSymbol}-${token.contract ?? token.symbol ?? symbol}`;

            return (
                <IconWrapper key={key} $size={size} $gap={gap} $length={length}>
                    {renderIcon(token, size)}
                </IconWrapper>
            );
        });
    }, [tokens, maxVisibleIcons, symbol, size, gap, length, renderIcon]);

    return (
        <IconSetBase
            count={length}
            size={size}
            gap={gap}
            maxVisibleIcons={maxVisibleIcons}
            isCountVisible={isCountVisible}
            isCentered={isCentered}
            isReversed={isReversed}
        >
            {visibleTokensContent}
        </IconSetBase>
    );
};
