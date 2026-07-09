import { useMemo } from 'react';

import { type NetworkSymbol, getNetwork } from '@suite-common/wallet-config';

import { type CommonIconSetProps, IconSetBase, IconWrapper } from '../IconSet/IconSetBase';
import { TokenLogo } from '../TokenLogo/TokenLogo';

export type TokenIconSetToken = {
    contract?: string | null;
    symbol?: string;
};

export type TokenIconSetProps = CommonIconSetProps & {
    symbol: NetworkSymbol;
    tokens: readonly TokenIconSetToken[];
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
}: TokenIconSetProps) => {
    const { length } = tokens;

    const visibleTokensContent = useMemo(() => {
        const visibleTokens = maxVisibleIcons !== null ? tokens.slice(0, maxVisibleIcons) : tokens;

        return visibleTokens.map(token => {
            const key = token.contract ?? token.symbol ?? symbol;
            const nativeCoinSymbol = getNetwork(symbol).settlementLayer ?? symbol;

            return (
                <IconWrapper key={key} $size={size} $gap={gap} $length={length}>
                    <TokenLogo
                        size={size}
                        symbol={token.contract ? symbol : nativeCoinSymbol}
                        contractAddress={token.contract}
                        placeholder={token.symbol ?? ''}
                        placeholderWithTooltip={false}
                        shouldTryToFetch
                        isBordered={false}
                    />
                </IconWrapper>
            );
        });
    }, [tokens, maxVisibleIcons, symbol, size, gap, length]);

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
