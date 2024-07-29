import { spacingsPx } from '@trezor/theme';
import { useEffect, useState } from 'react';
import invityAPI from 'src/services/suite/invityAPI';
import styled from 'styled-components';

interface CoinmarketCoinImageProps {
    symbol: string | undefined;
    size?: 'small' | 'medium' | 'large';
    className?: string;
}

const CoinmarketCoinImageWrapper = styled.img<{ $size: number }>`
    width: ${({ $size }) => $size}px;
    height: ${({ $size }) => $size}px;
`;

const getSize = (size: CoinmarketCoinImageProps['size']) => {
    switch (size) {
        case 'small':
            return 16;
        case 'large':
            return 24;
        default:
            return 20;
    }
};

export const CoinmarketCoinImage = ({
    symbol,
    className,
    size = 'medium',
}: CoinmarketCoinImageProps) => {
    const [logoSrc, setLogoSrc] = useState<string | null>(null);

    useEffect(() => {
        if (!symbol) return;

        const image = new Image();

        image.src = invityAPI.getCoinLogoUrl(symbol);
        image.onload = () => {
            setLogoSrc(invityAPI.getCoinLogoUrl(symbol));
        };
        image.onerror = () => {
            setLogoSrc(null);
        };
    }, [symbol]);

    if (!logoSrc) return null;

    return (
        <CoinmarketCoinImageWrapper
            className={className}
            src={logoSrc}
            alt={symbol}
            $size={getSize(size)}
        />
    );
};

export const CoinmarketFormOptionIcon = styled(CoinmarketCoinImage)`
    display: flex;
    align-items: center;
    margin-right: ${spacingsPx.xs};
`;
