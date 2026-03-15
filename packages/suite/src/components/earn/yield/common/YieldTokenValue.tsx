import type { NetworkSymbol } from '@suite-common/wallet-config';
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

export const YieldTokenValue = ({ token, value }: YieldTokenValueProps) => (
    <Row alignItems="center" gap={8}>
        {token.coingeckoId ? (
            <AssetLogo
                size={24}
                coingeckoId={token.coingeckoId}
                placeholder={token.symbol}
                symbol={token.networkSymbol}
                contractAddress={token.contractAddress}
                showNetworkIcon
            />
        ) : (
            <CoinLogo size={24} symbol={token.networkSymbol} type="tokenWithNetwork" />
        )}
        <Text typographyStyle="body-md-strong">{value}</Text>
    </Row>
);
