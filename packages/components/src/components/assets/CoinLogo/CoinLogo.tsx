import { ImgHTMLAttributes, useState } from 'react';
import { ReactSVG } from 'react-svg';
import styled from 'styled-components';
import { COINS } from './coins';
import { DefaultCoinLogo } from '../DefaultCoinLogo/DefaultCoinLogo';

export type CoinType = keyof typeof COINS;

export interface CoinLogoProps extends ImgHTMLAttributes<HTMLImageElement> {
    symbol?: CoinType;
    iconUrl?: string;
    className?: string;
    size?: number;
    index?: number;
    coinFirstCharacter?: string;
}

type WrapperProps = {
    $size: number;
};

const Wrapper = styled.div<WrapperProps>`
    display: inline-block;
    width: ${({ $size }) => $size}px;
    height: ${({ $size }) => $size}px;

    div {
        width: ${({ $size }) => $size}px;
        height: ${({ $size }) => $size}px;
        line-height: ${({ $size }) => $size}px;
    }
`;

type StyledIconImageProps = WrapperProps;

const StyledIconImage = styled.img<StyledIconImageProps>(
    ({ $size }) => `
        width: ${$size}px;
        height: ${$size}px;
    `,
);

type SVGCoinLogoProps = {
    $symbol: CoinType;
    $size?: number;
};

const SVGCoinLogo = ({ $symbol, $size = 32 }: SVGCoinLogoProps) => (
    <ReactSVG
        src={$symbol}
        beforeInjection={svg => {
            svg.setAttribute('width', `${$size}px`);
            svg.setAttribute('height', `${$size}px`);
        }}
    />
);

export const CoinLogo = ({
    symbol,
    iconUrl,
    className,
    size = 32,
    coinFirstCharacter,
    ...rest
}: CoinLogoProps) => {
    const [isLoading, setIsLoading] = useState(true);

    const logo = iconUrl ? (
        <>
            {isLoading && <span className="loading">Loading...</span>}
            <StyledIconImage
                src={iconUrl}
                $size={size}
                onLoad={() => setIsLoading(false)}
                onError={() => setIsLoading(false)}
                {...rest}
            />
        </>
    ) : (
        <DefaultCoinLogo size={size} coinFirstCharacter={coinFirstCharacter} />
    );

    return (
        <Wrapper className={className} $size={size} {...rest}>
            {symbol ? <SVGCoinLogo $symbol={COINS[symbol]} $size={size} /> : logo}
        </Wrapper>
    );
};
