import { ImgHTMLAttributes, useState } from 'react';
import { ReactSVG } from 'react-svg';
import styled from 'styled-components';
import { COINS } from './coins';

export type CoinType = keyof typeof COINS;

export interface CoinLogoProps extends ImgHTMLAttributes<HTMLImageElement> {
    symbol?: CoinType;
    iconUrl?: string;
    className?: string;
    size?: number;
    index?: number;
}

const Wrapper = styled.div<Omit<CoinLogoProps, 'symbol'>>`
    display: inline-block;
    width: ${({ size }) => size}px;
    height: ${({ size }) => size}px;

    div {
        width: ${({ size }) => size}px;
        height: ${({ size }) => size}px;
        line-height: ${({ size }) => size}px;
    }
`;

const StyledIconImage = styled.img<CoinLogoProps>(
    ({ size }) => `
        width: ${size}px;
        height: ${size}px;
    `,
);

export const CoinLogo = ({ symbol, iconUrl, className, size = 32, ...rest }: CoinLogoProps) => {
    const [isLoading, setIsLoading] = useState(true);

    if (symbol) {
        return (
            <Wrapper className={className} size={size} {...rest}>
                <ReactSVG
                    src={COINS[symbol]}
                    beforeInjection={svg => {
                        svg.setAttribute('width', `${size}px`);
                        svg.setAttribute('height', `${size}px`);
                    }}
                    loading={() => <span className="loading" />}
                />
            </Wrapper>
        );
    }

    return (
        <Wrapper className={className} size={size} {...rest}>
            {iconUrl && (
                <>
                    {isLoading && <span className="loading">Loading...</span>}
                    <StyledIconImage
                        src={iconUrl}
                        onLoad={() => setIsLoading(false)}
                        onError={() => setIsLoading(false)}
                        {...rest}
                    />
                </>
            )}
        </Wrapper>
    );
};
