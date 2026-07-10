import { type NetworkSymbol } from '@suite-common/wallet-config';
import { Row, Text } from '@trezor/components';
import { AssetLogo } from '@trezor/product-components';

import { FormattedCryptoAmount } from 'src/components/suite/FormattedCryptoAmount';

type YieldTokenValueToken = {
    symbol: string;
    networkSymbol: NetworkSymbol;
    contractAddress: string | null;
};

type YieldTokenValueProps = {
    token: YieldTokenValueToken;
    amount: string;
};

export const YieldTokenValue = ({ token, amount }: YieldTokenValueProps) => (
    <Row alignItems="center" gap={8}>
        <AssetLogo
            size={24}
            symbol={token.networkSymbol}
            contractAddress={token.contractAddress}
            placeholder={token.symbol}
            showNetworkIcon
            isBordered={false}
        />
        <Text typographyStyle="body-md-strong">
            <FormattedCryptoAmount value={amount} symbol={token.symbol} isBalance />
        </Text>
    </Row>
);
