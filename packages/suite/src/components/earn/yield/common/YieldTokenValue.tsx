import { AssetIcon } from '@suite/asset-icon';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { Row, Text } from '@trezor/components';

import { FormattedCryptoAmount } from 'src/components/suite/FormattedCryptoAmount';

type YieldTokenValueToken = {
    symbol: string;
    networkSymbol: NetworkSymbol;
    contractAddress: string | null;
    decimals: number;
};

type YieldTokenValueProps = {
    token: YieldTokenValueToken;
    amount: string;
    'data-testid'?: string;
};

export const YieldTokenValue = ({
    token,
    amount,
    'data-testid': dataTestId,
}: YieldTokenValueProps) => (
    <Row alignItems="center" gap={8}>
        <AssetIcon
            size={24}
            symbol={token.networkSymbol}
            contractAddress={token.contractAddress}
            placeholder={token.symbol}
            showNetworkIcon
            isBordered={false}
        />
        <Text typographyStyle="body-md-strong">
            <FormattedCryptoAmount
                value={amount}
                symbol={token.symbol}
                tokenDecimals={token.decimals}
                data-testid={dataTestId}
            />
        </Text>
    </Row>
);
