import { CoinLogo } from '@trezor/components';
import { CoinmarketCoinLogoProps } from 'src/types/coinmarket/coinmarket';
import { parseCryptoId } from 'src/utils/wallet/coinmarket/coinmarketUtils';

export const CoinmarketCoinLogo = ({ cryptoId, size = 24, ...rest }: CoinmarketCoinLogoProps) => {
    const { networkId, contractAddress } = parseCryptoId(cryptoId);

    return (
        <CoinLogo coingeckoId={networkId} contractAddress={contractAddress} size={size} {...rest} />
    );
};
