import { ImgHTMLAttributes } from 'react';
import { ReactSVG } from 'react-svg';
import styled from 'styled-components';
import { COINS } from './coins';
import { coinsColors, spacings } from '@trezor/theme';

export type CoinType = keyof typeof COINS;

const BORDER_SIZE = spacings.sm;
const MARGIN_SIZE = spacings.xs;

const ShareIndicator = styled.div<{ size: number; symbol?: string }>`
    background: ${({ symbol, theme }) =>
        symbol && coinsColors[symbol] ? coinsColors[symbol] : theme.iconSubdued};
    transition: background 5s;
    border-radius: 50%;
    width: ${({ size }) => size + BORDER_SIZE * 2}px;
    height: ${({ size }) => size + BORDER_SIZE * 2}px;
    align-items: center;
    display: flex;
    justify-content: center;
`;
const LogoInnerBorder = styled.div<{ size: number; hasShareIndicator: boolean }>`
    background-color: ${({ theme }) => theme.backgroundSurfaceElevation1};
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    height: ${props => props.size + (props.hasShareIndicator ? MARGIN_SIZE : 0)}px;
    width: ${props => props.size + (props.hasShareIndicator ? MARGIN_SIZE : 0)}px;
`;
const SvgWrapper = styled.div<Omit<CoinLogoProps, 'symbol'>>`
    display: inline-block;
    height: ${props => props.size}px;
    width: ${props => props.size}px;

    div {
        height: ${props => props.size}px;
        line-height: ${props => props.size}px;
    }
`;

export interface CoinLogoProps extends ImgHTMLAttributes<HTMLImageElement> {
    symbol: CoinType;
    className?: string;
    size?: number;
    hasShareIndicator?: boolean;
}

const Logo = ({
    symbol,
    className,
    size = 32,
    hasShareIndicator = false,
    ...rest
}: CoinLogoProps) => (
    <LogoInnerBorder size={size} hasShareIndicator={hasShareIndicator}>
        <SvgWrapper className={className} size={size} {...rest}>
            <ReactSVG
                src={COINS[symbol]}
                beforeInjection={svg => {
                    svg.setAttribute('width', `${size}px`);
                    svg.setAttribute('height', `${size}px`);
                }}
                loading={() => <span className="loading" />}
            />
        </SvgWrapper>
    </LogoInnerBorder>
);

const CoinLogo = ({
    symbol,
    className,
    size = 32,
    hasShareIndicator = false,
    ...rest
}: CoinLogoProps) =>
    hasShareIndicator ? (
        <ShareIndicator size={size} symbol={symbol}>
            <Logo symbol={symbol} className={className} size={size} hasShareIndicator {...rest} />
        </ShareIndicator>
    ) : (
        <Logo symbol={symbol} className={className} size={size} {...rest} />
    );

export { CoinLogo };
