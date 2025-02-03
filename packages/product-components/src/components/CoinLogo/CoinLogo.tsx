import { ImgHTMLAttributes } from 'react';
import { ReactSVG } from 'react-svg';

import styled from 'styled-components';

import { NetworkSymbol, getNetworkDisplaySymbol } from '@suite-common/wallet-config';
import { borders } from '@trezor/theme';

import { COINS, LegacyNetworkSymbol } from './coins';
import { NETWORK_ICONS } from './networks';

const DEFAULT_SIZE = 32;

const getSize = (size?: number, border = 0, divisor = 1) =>
    `${(size ?? DEFAULT_SIZE) / divisor + border * 2}px`;

export interface CoinLogoProps extends ImgHTMLAttributes<HTMLImageElement> {
    symbol: NetworkSymbol | LegacyNetworkSymbol;
    type?: 'coin' | 'network' | 'badge';
    className?: string;
    size?: number;
    index?: number;
}

const SvgWrapper = styled.div<Omit<CoinLogoProps, 'symbol'>>`
    position: relative;
    display: inline-block;
    width: ${({ size }) => getSize(size)};
    height: ${({ size }) => getSize(size)};

    .coin-symbol {
        width: ${({ size }) => getSize(size)};
        height: ${({ size }) => getSize(size)};
        line-height: ${({ size }) => getSize(size)};
    }

    .network-symbol {
        position: absolute;
        bottom: 0;
        right: 0;
        width: ${({ size }) => getSize(size, 1, 3)};
        height: ${({ size }) => getSize(size, 1, 3)};
        line-height: 0;
        border-radius: ${borders.radii.xxs};
        border: 1px solid white;
        background-color: white;

        @media (prefers-color-scheme: dark) {
            border: 1px solid black;
            background-color: black;
        }
    }
`;

export const CoinLogo = ({
    symbol,
    type = 'coin',
    className,
    size = DEFAULT_SIZE,
    ...rest
}: CoinLogoProps) => {
    const networkSymbol = getNetworkDisplaySymbol(
        symbol as NetworkSymbol,
    ).toLowerCase() as NetworkSymbol;

    const symbolSrc =
        // eslint-disable-next-line no-nested-ternary
        type === 'coin'
            ? COINS[symbol]
            : type === 'network'
              ? NETWORK_ICONS[symbol as NetworkSymbol]
              : COINS[networkSymbol != symbol ? networkSymbol : symbol];

    const badge =
        type !== 'coin' && type !== 'network' && networkSymbol != symbol
            ? NETWORK_ICONS[symbol as NetworkSymbol]
            : null;

    return (
        <SvgWrapper className={className} size={size} {...rest}>
            <ReactSVG
                src={symbolSrc ?? COINS[symbol]}
                beforeInjection={svg => {
                    svg.setAttribute('width', getSize(size));
                    svg.setAttribute('height', getSize(size));
                }}
                loading={() => <span className="loading" />}
                className="coin-symbol"
            />
            {badge && symbolSrc != null && (
                <ReactSVG
                    src={badge}
                    beforeInjection={svg => {
                        svg.setAttribute('width', getSize(size, 0, 3));
                        svg.setAttribute('height', getSize(size, 0, 3));
                    }}
                    loading={() => <span className="loading" />}
                    className="network-symbol"
                />
            )}
        </SvgWrapper>
    );
};
