import { type TokenDto } from '@suite-common/earn-api';
import { type NetworkSymbol, getCoingeckoId } from '@suite-common/wallet-config';
import { AssetLogo, type AssetLogoSize, CoinLogo } from '@trezor/product-components';

type VaultTokenLogoProps = {
    token: Pick<TokenDto, 'symbol' | 'name' | 'address' | 'coinGeckoId'>;
    networkSymbol: NetworkSymbol;
    size: AssetLogoSize;
    showNetworkIcon?: boolean;
};

export const VaultTokenLogo = ({
    token,
    networkSymbol,
    size,
    showNetworkIcon = false,
}: VaultTokenLogoProps) => {
    const coingeckoId = getCoingeckoId(networkSymbol) ?? token.coinGeckoId;

    if (coingeckoId) {
        return (
            <AssetLogo
                size={size}
                coingeckoId={coingeckoId}
                placeholder={token.symbol || token.name || 'token'}
                symbol={networkSymbol}
                contractAddress={token.address ?? null}
                showNetworkIcon={showNetworkIcon}
            />
        );
    }

    return <CoinLogo size={size} symbol={networkSymbol} type="tokenWithNetwork" />;
};
