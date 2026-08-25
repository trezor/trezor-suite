import { useMemo } from 'react';

import { type NetworkSymbol, getNetwork } from '@suite-common/wallet-config';

import { type CommonIconSetProps, IconSetBase, IconWrapper } from '../IconSet/IconSetBase';
import { TokenIcon } from '../TokenIcon/TokenIcon';

export type TokenIconSetToken = {
    contract?: string | null;
    symbol?: string;
    networkSymbol?: NetworkSymbol;
};

export type TokenIconSetProps = CommonIconSetProps & {
    symbol: NetworkSymbol;
    tokens: readonly TokenIconSetToken[];
    isTransparent?: boolean;
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
    isTransparent = false,
}: TokenIconSetProps) => {
    const { length } = tokens;

    const visibleTokensContent = useMemo(() => {
        const visibleTokens = maxVisibleIcons !== null ? tokens.slice(0, maxVisibleIcons) : tokens;

        return visibleTokens.map(token => {
            const tokenNetworkSymbol = token.networkSymbol ?? symbol;
            const key = `${tokenNetworkSymbol}-${token.contract ?? token.symbol ?? symbol}`;
            const nativeCoinSymbol =
                getNetwork(tokenNetworkSymbol).settlementLayer ?? tokenNetworkSymbol;

            return (
                <IconWrapper key={key} $size={size} $gap={gap} $length={length}>
                    {token.contract ? (
                        <TokenIcon
                            size={size}
                            symbol={tokenNetworkSymbol}
                            contractAddress={token.contract ?? null}
                            placeholder={token.symbol ?? ''}
                            placeholderWithTooltip={false}
                            shouldTryToFetch
                            isBordered={false}
                            isTransparent={isTransparent}
                        />
                    ) : (
                        <TokenIcon size={size} symbol={nativeCoinSymbol} />
                    )}
                </IconWrapper>
            );
        });
    }, [tokens, maxVisibleIcons, symbol, size, gap, length, isTransparent]);

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
