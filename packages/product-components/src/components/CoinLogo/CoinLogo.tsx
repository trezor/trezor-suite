import { ReactSVG } from 'react-svg';

import styled from 'styled-components';

import { cryptoIcons } from '@suite-common/icons/src/cryptoIcons';
import { type NetworkIconSymbol } from '@suite-common/icons/src/iconSymbols';
import { isNetworkIconSymbol } from '@suite-common/icons/src/iconUtils';
import { getNetworkOptional } from '@suite-common/wallet-config';

import { NetworkIcon } from '../NetworkIcon/NetworkIcon';
import { NetworkIconBadge } from '../NetworkIcon/NetworkIconBadge';

export const allowedCoinLogoSizes = [16, 20, 24, 32, 40, 48, 64] as const;
export type CoinLogoSize = (typeof allowedCoinLogoSizes)[number];

export const COIN_LOGO_TYPE = ['token', 'network', 'tokenWithNetwork'] as const;
export type CoinLogoType = (typeof COIN_LOGO_TYPE)[number];

export type CoinLogoProps = {
    symbol: NetworkIconSymbol;
    type?: CoinLogoType;
    size?: CoinLogoSize;
    'data-testid'?: string;
};

const SvgContainer = styled.div<{ $size: CoinLogoSize }>`
    display: flex;
    flex-shrink: 0;
    width: ${({ $size }) => $size}px;
    height: ${({ $size }) => $size}px;
`;

const StyledReactSVG = styled(ReactSVG)`
    display: flex;
    width: 100%;
    height: 100%;

    div {
        display: flex;
        width: 100%;
        height: 100%;
    }

    svg {
        display: block;
        width: 100%;
        height: 100%;
    }
` as typeof ReactSVG;

type CoinSvgProps = {
    src: string;
    size: CoinLogoSize;
    'data-testid'?: string;
};

const CoinSvg = ({ src, size, 'data-testid': dataTestId }: CoinSvgProps) => (
    <SvgContainer $size={size} data-testid={dataTestId}>
        <StyledReactSVG
            src={src}
            beforeInjection={svg => {
                svg.setAttribute('width', `${size}px`);
                svg.setAttribute('height', `${size}px`);
            }}
            loading={() => <span className="loading" />}
        />
    </SvgContainer>
);

export const CoinLogo = ({
    symbol,
    type = 'token',
    size = 32,
    'data-testid': dataTestId,
}: CoinLogoProps) => {
    if (type === 'network' && isNetworkIconSymbol(symbol)) {
        return <NetworkIcon networkSymbol={symbol} size={size} data-testid={dataTestId} />;
    }

    if (type === 'tokenWithNetwork') {
        const network = getNetworkOptional(symbol);
        const networkSymbol = network?.settlementLayer ?? symbol;
        const displaySymbol = networkSymbol !== symbol ? networkSymbol : symbol;
        const src = cryptoIcons[displaySymbol];
        const coin = <CoinSvg src={src} size={size} data-testid={dataTestId} />;

        if (networkSymbol !== symbol && isNetworkIconSymbol(symbol)) {
            return (
                <NetworkIconBadge networkSymbol={symbol} parentSize={size} data-testid={dataTestId}>
                    {coin}
                </NetworkIconBadge>
            );
        }

        return coin;
    }

    return <CoinSvg src={cryptoIcons[symbol]} size={size} data-testid={dataTestId} />;
};
