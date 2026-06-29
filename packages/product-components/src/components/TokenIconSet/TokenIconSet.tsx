import { useMemo } from 'react';

import { type NetworkSymbol, getNetwork } from '@suite-common/wallet-config';

import { AssetLogo } from '../AssetLogo/AssetLogo';
import { CoinLogo } from '../CoinLogo/CoinLogo';
import { type CommonIconSetProps, IconSetBase, IconWrapper } from '../IconSet/IconSetBase';

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
                    {token.contract ? (
                        <AssetLogo
                            size={size}
                            symbol={symbol}
                            contractAddress={token.contract ?? null}
                            placeholder={token.symbol ?? ''}
                            placeholderWithTooltip={false}
                            shouldTryToFetch
                            isBordered={false}
                        />
                    ) : (
                        <CoinLogo size={size} symbol={nativeCoinSymbol} type="token" />
                    )}
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
