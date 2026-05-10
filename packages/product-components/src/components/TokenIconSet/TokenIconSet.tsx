import { useMemo } from 'react';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type SpacingValuesNew } from '@trezor/theme';

import { AssetLogo } from '../AssetLogo/AssetLogo';
import { type AssetLogoSize } from '../AssetLogo/AssetLogoWithId';
import { IconSetBase, IconWrapper } from '../IconSet/IconSetBase';

export type TokenIconSetProps = {
    symbol: NetworkSymbol;
    tokens: { contract: string; symbol?: string }[]; // tokens represented by their contract addresses and symbols
    size: AssetLogoSize;
    gap: SpacingValuesNew;
    /** Maximum number of icons to show. When `undefined`, all icons are shown. @default 3 */
    maxVisibleIcons?: number;
    isCountVisible?: boolean;
    isCentered?: boolean;
    /**
     * If true, visible tokens will be displayed from the last token to the first.
     */
    isReversed?: boolean;
};

export const TokenIconSet = ({
    symbol,
    tokens,
    size,
    gap,
    maxVisibleIcons,
    isCountVisible = false,
    isCentered = false,
    isReversed = true,
}: TokenIconSetProps) => {
    const { length } = tokens;

    const visibleTokensContent = useMemo(() => {
        const visibleTokens =
            maxVisibleIcons !== undefined ? tokens.slice(0, maxVisibleIcons) : tokens;

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
