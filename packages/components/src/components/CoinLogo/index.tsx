/* eslint-disable global-require */
import React from 'react';
import ReactSvg from 'react-svg';
import styled from 'styled-components';
import { COINS } from './coins';

const SvgWrapper = styled.div<Omit<Props, 'symbol'>>`
    display: inline-block;
    height: ${props => props.size}px;

    div {
        height: ${props => props.size}px;
        line-height: ${props => props.size}px;
    }
`;

interface Props extends React.ImgHTMLAttributes<HTMLImageElement> {
    symbol: string;
    className?: string;
    size?: number;
}

const CoinLogo = ({ symbol, className, size = 32, ...rest }: Props) => {
    return (
        <SvgWrapper className={className} size={size} {...rest}>
            <ReactSvg
                src={COINS[symbol]}
                beforeInjection={svg => {
                    svg.setAttribute('width', `${size}px`);
                    svg.setAttribute('height', `${size}px`);
                }}
                loading={() => <span className="loading" />}
            />
        </SvgWrapper>
    );
};

export { CoinLogo, Props as CoinLogoProps };
