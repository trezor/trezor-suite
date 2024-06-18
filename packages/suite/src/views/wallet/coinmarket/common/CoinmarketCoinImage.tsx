import { useEffect, useState } from 'react';
import invityAPI from 'src/services/suite/invityAPI';

interface CoinmarketCoinImageProps {
    symbol: string | undefined;
    className?: string;
}

const CoinmarketCoinImage = ({ symbol, className }: CoinmarketCoinImageProps) => {
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

    return <img className={className} src={logoSrc} alt={symbol} />;
};

export default CoinmarketCoinImage;
