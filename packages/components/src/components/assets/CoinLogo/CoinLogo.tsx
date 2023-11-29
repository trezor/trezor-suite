import { ImgHTMLAttributes } from 'react';
import { ReactSVG } from 'react-svg';
import styled from 'styled-components';
import { COINS } from './coins';
import { coinsColors } from '@trezor/theme';

export type CoinType = keyof typeof COINS;

const LogoOuterBorder = styled.div<{ size: number; symbol?: string }>`
    background: ${({ symbol, theme }) =>
        symbol && coinsColors[symbol] ? coinsColors[symbol] : theme.iconSubdued};
    transition: background 5s;
    border-radius: 50%;
    width: ${props => props.size + 12 * 2}px;
    height: ${props => props.size + 12 * 2}px;
    align-items: center;
    display: flex;
    justify-content: center;
`;
const LogoInnerBorder = styled.div<{ size: number }>`
    background-color: ${({ theme }) => theme.backgroundSurfaceElevation1};

    /* padding: 4px;     */
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    height: ${props => props.size + 8}px;
    width: ${props => props.size + 8}px;
`;
const SvgWrapper = styled.div<Omit<CoinLogoProps, 'symbol'>>`
    display: inline-block;
    height: ${props => props.size}px;
    width: ${props => props.size}px;

    border div {
        height: ${props => props.size}px;
        line-height: ${props => props.size}px;
    }
`;

export interface CoinLogoProps extends ImgHTMLAttributes<HTMLImageElement> {
    symbol: CoinType;
    className?: string;
    size?: number;
}

const CoinLogo = ({ symbol, className, size = 32, ...rest }: CoinLogoProps) => (
    <LogoOuterBorder size={size} symbol={symbol}>
        <LogoInnerBorder size={size}>
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
    </LogoOuterBorder>
);

export { CoinLogo };
