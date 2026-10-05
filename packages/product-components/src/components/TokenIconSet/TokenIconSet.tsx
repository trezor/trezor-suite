import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { type NetworkSymbol } from '@trezor/network-module-types';

import { selectNetworkConfigs } from '../../network-display/networkDisplaySelectors';
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
    const networks = useSelector(selectNetworkConfigs);
    const { length } = tokens;

    const visibleTokensContent = useMemo(() => {
        const visibleTokens = maxVisibleIcons !== null ? tokens.slice(0, maxVisibleIcons) : tokens;

        return visibleTokens.map(token => {
            const tokenNetworkSymbol = token.networkSymbol ?? symbol;
            const key = `${tokenNetworkSymbol}-${token.contract ?? token.symbol ?? symbol}`;
            const nativeCoinSymbol =
                networks?.[tokenNetworkSymbol]?.settlementLayer ?? tokenNetworkSymbol;

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
    }, [networks, tokens, maxVisibleIcons, symbol, size, gap, length, isTransparent]);

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
