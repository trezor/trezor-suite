import { useMemo } from 'react';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type SpacingValuesNew } from '@trezor/theme';

import { AssetLogo } from '../AssetLogo/AssetLogo';
import { type AssetLogoSize } from '../AssetLogo/AssetLogoWithId';
import { IconSetBase, IconWrapper, MAX_VISIBLE_ICONS } from '../IconSet/IconSetBase';

export type TokenIconSetProps = {
    symbol: NetworkSymbol;
    tokens: { contract: string; symbol?: string }[]; // tokens represented by their contract addresses and symbols
    size: AssetLogoSize;
    gap: SpacingValuesNew;
    isCountVisible?: boolean;
    isCentered?: boolean;
    /**
     * If true, visible tokens will be displayed from the last token to the first.
     */
    reverseVisibleTokens?: boolean;
};

export const TokenIconSet = ({
    symbol,
    tokens,
    size,
    gap,
    isCountVisible = false,
    isCentered = false,
    reverseVisibleTokens = true,
}: TokenIconSetProps) => {
    const { length } = tokens;

    const visibleTokensContent = useMemo(() => {
        const visibleTokens = tokens.slice(0, MAX_VISIBLE_ICONS);
        const orderedTokens = reverseVisibleTokens ? visibleTokens.reverse() : visibleTokens;

        return orderedTokens?.map(token => (
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
    }, [tokens, reverseVisibleTokens, symbol, size, gap, length]);

    return (
        <IconSetBase
            count={length}
            size={size}
            gap={gap}
            isCountVisible={isCountVisible}
            isCentered={isCentered}
        >
            {visibleTokensContent}
        </IconSetBase>
    );
};
