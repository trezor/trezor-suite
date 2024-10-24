import { AssetLogo, useElevation } from '@trezor/components';
import { getCoingeckoId } from '@suite-common/wallet-config';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { TokenInfo } from '@trezor/connect';
import { getContractAddressForNetwork } from '@suite-common/wallet-utils';

import styled, { css } from 'styled-components';
import { borders, Elevation, mapElevationToBackground, mapElevationToBorder } from '@trezor/theme';

export type TokenIconSetProps = {
    network: NetworkSymbol;
    tokens: TokenInfo[];
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
export const TokenIconSet = ({ network, tokens }: TokenIconSetProps) => {
    const { elevation } = useElevation();
    const { length } = tokens;

    if (length === 0) {
        return null;
    }

    const visibleTokens = tokens.slice(0, 3).reverse();

    const coingeckoId = getCoingeckoId(network);

    return (
        <IconContainer $length={length}>
            {length > 3 && <TokenIconPlaceholder $elevation={elevation} />}
            {visibleTokens.map(token => (
                <AssetLogo
                    key={token.contract}
                    size={20}
                    coingeckoId={coingeckoId ?? ''}
                    contractAddress={getContractAddressForNetwork(network, token.contract)}
                    placeholder={token.symbol?.toUpperCase() ?? ''}
                    placeholderWithTooltip={false}
                />
            ))}
        </IconContainer>
    );
};
