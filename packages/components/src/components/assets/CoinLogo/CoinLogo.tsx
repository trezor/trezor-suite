import { ImgHTMLAttributes } from 'react';
import { ReactSVG } from 'react-svg';
import styled from 'styled-components';
import { COINS } from './coins';

export type CoinType = keyof typeof COINS;

export const LogoBorder = styled.div`
    background-color: ${({ theme }) => theme.backgroundSurfaceElevation1};
    border: solid 8px ${({ theme }) => theme.borderOnElevation1};
    padding: 4px;
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
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
    <LogoBorder>
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
    </LogoBorder>
);

export { CoinLogo };
