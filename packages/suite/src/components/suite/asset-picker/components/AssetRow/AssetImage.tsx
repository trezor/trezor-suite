import {
    NetworkSymbolExtended,
    NetworkType,
    getDisplaySymbol,
    isNetworkSymbol,
} from '@suite-common/wallet-config';
import { getAssetLogoContractAddresses } from '@suite-common/wallet-utils';
import { AssetLogo, type AssetLogoProps } from '@trezor/components';
import { CoinLogo } from '@trezor/product-components';

type AssetImageProps = {
    networkSymbol: NetworkSymbolExtended;
    networkType: NetworkType;
    contractAddress?: string;
    symbol: string;
    size?: AssetLogoProps['size'];
};

export function AssetImage({
    networkType,
    contractAddress,
    networkSymbol,
    symbol,
    size = 40,
}: AssetImageProps) {
    if (!contractAddress && isNetworkSymbol(networkSymbol)) {
        return <CoinLogo symbol={networkSymbol} size={size} type="tokenWithNetwork" />;
    }

    return (
        <AssetLogo
            size={size}
            coingeckoId={networkType}
            contractAddress={getAssetLogoContractAddresses(networkSymbol, contractAddress)}
            placeholder={getDisplaySymbol(symbol, contractAddress)}
        />
    );
}
