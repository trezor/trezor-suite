import { type NetworkSymbol, getCoingeckoId } from '@suite-common/wallet-config';
import { Row, Text } from '@trezor/components';
import { AssetLogo, CoinLogo } from '@trezor/product-components';

type YieldTokenValueToken = {
    coingeckoId?: string;
    symbol: string;
    networkSymbol: NetworkSymbol;
    contractAddress: string | null;
};

type YieldTokenValueProps = {
    token: YieldTokenValueToken;
    value: string;
};

export const YieldTokenValue = ({ token, value }: YieldTokenValueProps) => {
    const assetLogo =
        token.contractAddress || token.coingeckoId
            ? {
                  coingeckoId: getCoingeckoId(token.networkSymbol) ?? token.coingeckoId,
                  placeholder: token.symbol,
                  contractAddress: token.contractAddress,
              }
            : undefined;

    return (
        <Row alignItems="center" gap={8}>
            {assetLogo?.coingeckoId ? (
                <AssetLogo
                    size={24}
                    coingeckoId={assetLogo.coingeckoId}
                    placeholder={assetLogo.placeholder}
                    symbol={token.networkSymbol}
                    contractAddress={assetLogo.contractAddress}
                    showNetworkIcon
                />
            ) : (
                <CoinLogo size={24} symbol={token.networkSymbol} type="tokenWithNetwork" />
            )}
            <Text typographyStyle="body-md-strong">{value}</Text>
        </Row>
    );
};
