import { useMemo } from 'react';

import styled, { css } from 'styled-components';

import { NetworkSymbol, getCoingeckoId } from '@suite-common/wallet-config';
import { useElevation } from '@trezor/components';
import { Elevation, borders, mapElevationToBackground, mapElevationToBorder } from '@trezor/theme';

import { AssetLogo } from '../AssetLogo/AssetLogo';

export type TokenIconSetProps = {
    symbol: NetworkSymbol;
    tokens: { contract: string; symbol?: string }[]; // tokens represented by their contract addresses and symbols
};

const IconContainer = styled.div<{ $length: number }>`
    width: 24px;
    justify-content: center;
    display: flex;
    align-items: center;
    ${({ $length }) =>
        $length > 1 &&
        css`
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(${$length > 1 ? '1px' : '6px'}, 6px));
            direction: rtl;
            justify-items: center;
        `}
`;

const TokenIconPlaceholder = styled.div<{ $elevation: Elevation }>`
    width: 20px;
    height: 20px;
    border-radius: ${borders.radii.full};
    border: 1px solid ${mapElevationToBorder};
    background: ${mapElevationToBackground};
`;

/**
 * @param tokens - provide already sorted tokens (for example by fiat value).
 */
export const TokenIconSet = ({ symbol, tokens }: TokenIconSetProps) => {
    const { elevation } = useElevation();
    const { length } = tokens;

    const visibleTokensContent = useMemo(() => {
        const visibleTokens = tokens.slice(0, 3).reverse();
        const coingeckoId = getCoingeckoId(symbol);

        return visibleTokens?.map(token => (
            <AssetLogo
                key={token.contract}
                size={20}
                coingeckoId={coingeckoId ?? ''}
                symbol={symbol}
                contractAddress={token.contract}
                placeholder={token.symbol?.toUpperCase() ?? ''}
                placeholderWithTooltip={false}
            />
        ));
    }, [symbol, tokens]);

    if (length === 0) {
        return null;
    }

    return (
        <IconContainer $length={length}>
            {length > 3 && <TokenIconPlaceholder $elevation={elevation} />}
            {visibleTokensContent}
        </IconContainer>
    );
};
