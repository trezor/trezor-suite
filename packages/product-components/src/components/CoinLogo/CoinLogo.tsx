import { type ImgHTMLAttributes } from 'react';
import { ReactSVG } from 'react-svg';

import styled from 'styled-components';

import { isNetworkIconSymbol } from '@suite-common/icons';
import { type NetworkSymbol, getNetworkOptional } from '@suite-common/wallet-config';

import { COINS, type LegacyNetworkSymbol } from '../../constants/coins';
import { NetworkIcon } from '../NetworkIcon/NetworkIcon';
import { NetworkIconBadge } from '../NetworkIcon/NetworkIconBadge';

export const COIN_LOGO_TYPE = ['token', 'network', 'tokenWithNetwork'] as const;
export type CoinLogoType = (typeof COIN_LOGO_TYPE)[number];

const DEFAULT_SIZE = 32;

export interface CoinLogoProps extends ImgHTMLAttributes<HTMLImageElement> {
    symbol: NetworkSymbol | LegacyNetworkSymbol;
    type?: CoinLogoType;
    size?: number;
    index?: number;
}

const SvgWrapper = styled.div<{ $size: number }>`
    position: relative;
    display: inline-block;
    width: ${({ $size }) => $size}px;
    height: ${({ $size }) => $size}px;
`;

const SvgContainer = styled.div<{ $size: number }>`
    width: ${({ $size }) => $size}px;
    height: ${({ $size }) => $size}px;
    line-height: ${({ $size }) => $size}px;

    > div {
        width: 100%;
        height: 100%;
        line-height: inherit;
    }
`;

export const CoinLogo = ({
    symbol,
    type = 'token',
    size = DEFAULT_SIZE,
    ...rest
}: CoinLogoProps) => {
    let symbolSrc;
    let shouldShowNetworkBadge = false;

    if (type === 'token') {
        symbolSrc = COINS[symbol];
    } else if (type === 'network') {
        if (isNetworkIconSymbol(symbol)) {
            return (
                <SvgWrapper $size={size} {...rest}>
                    <NetworkIcon networkSymbol={symbol} size={size} />
                </SvgWrapper>
            );
        }
    } else {
        const network = getNetworkOptional(symbol);
        const networkSymbol = network?.settlementLayer ?? symbol;

        shouldShowNetworkBadge = networkSymbol !== symbol && isNetworkIconSymbol(symbol);
        symbolSrc = COINS[networkSymbol !== symbol ? networkSymbol : symbol];
    }

    return (
        <SvgWrapper $size={size} {...rest}>
            <SvgContainer $size={size}>
                <ReactSVG
                    src={symbolSrc ?? COINS[symbol]}
                    beforeInjection={svg => {
                        svg.setAttribute('width', `${size}px`);
                        svg.setAttribute('height', `${size}px`);
                    }}
                    loading={() => <span className="loading" />}
                />
            </SvgContainer>
            {shouldShowNetworkBadge && (
                <NetworkIconBadge networkSymbol={symbol} parentSize={size} />
            )}
        </SvgWrapper>
    );
};
