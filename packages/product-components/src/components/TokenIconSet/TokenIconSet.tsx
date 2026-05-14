import { useMemo } from 'react';

import { type NetworkSymbol } from '@suite-common/wallet-config';

import { AssetLogo } from '../AssetLogo/AssetLogo';
import { type CommonIconSetProps, IconSetBase, IconWrapper } from '../IconSet/IconSetBase';

export type TokenIconSetProps = CommonIconSetProps & {
    symbol: NetworkSymbol;
    tokens: { contract: string; symbol?: string }[]; // tokens represented by their contract addresses and symbols
};

export const TokenIconSet = ({
    symbol,
    tokens,
    size,
    gap,
    maxVisibleIcons = 3,
    isCountVisible = false,
    isCentered = false,
    isReversed = true,
}: TokenIconSetProps) => {
    const { length } = tokens;

    const visibleTokensContent = useMemo(() => {
        const visibleTokens = maxVisibleIcons !== null ? tokens.slice(0, maxVisibleIcons) : tokens;

        return visibleTokens.map(token => (
            <IconWrapper key={token.contract} $size={size} $gap={gap} $length={length}>
                <AssetLogo
                    size={size}
                    symbol={symbol}
                    contractAddress={token.contract}
                    placeholder={token.symbol ?? ''}
                    placeholderWithTooltip={false}
                />
            </IconWrapper>
        ));
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
