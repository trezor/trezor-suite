import { parseCryptoId } from '@suite-common/trading';
import { getNetworkByCoingeckoId } from '@suite-common/wallet-config';
import { AssetIcon } from '@trezor/product-components';

import { type TradingCoinLogoProps } from 'src/types/trading/trading';

export const TradingCoinLogo = ({ cryptoId, size = 24, margin }: TradingCoinLogoProps) => {
    const { networkId, contractAddress } = parseCryptoId(cryptoId);
    const networkSymbol = getNetworkByCoingeckoId(networkId)?.symbol;

    if (!networkSymbol) return null;

    return (
        <AssetIcon
            symbol={networkSymbol}
            contractAddress={contractAddress}
            size={size}
            placeholder={networkId.toUpperCase()}
            margin={margin}
        />
    );
};
