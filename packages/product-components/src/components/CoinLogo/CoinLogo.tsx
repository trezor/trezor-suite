import { ImgHTMLAttributes } from 'react';
import { ReactSVG } from 'react-svg';

import styled from 'styled-components';

import { NetworkSymbol, getNetworkOptional } from '@suite-common/wallet-config';
import { borders } from '@trezor/theme';

import { COINS, LegacyNetworkSymbol } from './coins';
import { NETWORK_ICONS } from './networks';

export const COIN_LOGO_TYPE = ['token', 'network', 'tokenWithNetwork'] as const;
export type CoinLogoType = (typeof COIN_LOGO_TYPE)[number];

const DEFAULT_SIZE = 32;

const getSize = (size?: number, border = 0, divisor = 1) =>
    `${(size ?? DEFAULT_SIZE) / divisor + border * 2}px`;

export interface CoinLogoProps extends ImgHTMLAttributes<HTMLImageElement> {
    symbol: NetworkSymbol | LegacyNetworkSymbol;
    type?: CoinLogoType;
    className?: string;
    size?: number;
    index?: number;
}

const SvgWrapper = styled.div<{ $size?: number }>`
    position: relative;
    display: inline-block;
    width: ${({ $size }) => getSize($size)};
    height: ${({ $size }) => getSize($size)};

    > div {
        width: ${({ $size }) => getSize($size)};
        height: ${({ $size }) => getSize($size)};
        line-height: ${({ $size }) => getSize($size)};
    }

    > div + div {
        position: absolute;
        bottom: 0;
        right: 0;
        width: ${({ $size }) => getSize($size, 1, 3)};
        height: ${({ $size }) => getSize($size, 1, 3)};
        line-height: 0;
        border-radius: ${borders.radii.xxs};
        border-width: 1px;
        border-style: solid;
        border-color: ${({ theme }) => theme.backgroundTertiaryDefaultOnElevation0};
        background-color: ${({ theme }) => theme.backgroundTertiaryDefaultOnElevation0};

        div {
            line-height: 0;
        }
    }

    svg {
        .bg {
            fill: ${({ theme }) => theme.logoBg};
        }

        .fg {
            fill: ${({ theme }) => theme.logoFg};
        }
    }
`;

export const CoinLogo = ({
    symbol,
    type = 'token',
    className,
    size = DEFAULT_SIZE,
    ...rest
}: CoinLogoProps) => {
    let symbolSrc;
    let badge;

    if (type === 'token') {
        symbolSrc = COINS[symbol];
    } else if (type === 'network') {
        symbolSrc = NETWORK_ICONS[symbol as NetworkSymbol];
    } else {
        const network = getNetworkOptional(symbol);
        const networkSymbol = network?.settlementLayer ?? symbol;

        badge = networkSymbol !== symbol ? NETWORK_ICONS[symbol as NetworkSymbol] : null;
        symbolSrc = COINS[networkSymbol !== symbol ? networkSymbol : symbol];
    }

    return (
        <SvgWrapper className={className} $size={size} {...rest}>
            <ReactSVG
                src={symbolSrc ?? COINS[symbol]}
                beforeInjection={svg => {
                    svg.setAttribute('width', getSize(size));
                    svg.setAttribute('height', getSize(size));
                }}
                loading={() => <span className="loading" />}
            />
            {badge && symbolSrc != null && (
                <ReactSVG
                    src={badge}
                    beforeInjection={svg => {
                        svg.setAttribute('width', getSize(size, 0, 3));
                        svg.setAttribute('height', getSize(size, 0, 3));
                    }}
                    loading={() => <span className="loading" />}
                />
            )}
        </SvgWrapper>
    );
};
