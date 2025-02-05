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
    let symbolSrc;
    let badge;

    if (type === 'coin') {
        symbolSrc = COINS[symbol];
    } else if (type === 'network') {
        symbolSrc = NETWORK_ICONS[symbol as NetworkSymbol];
    } else {
        // TODO: should be changed, this is hacky way
        const networkSymbol = getNetworkDisplaySymbol(
            symbol as NetworkSymbol,
        )?.toLowerCase() as NetworkSymbol;

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
