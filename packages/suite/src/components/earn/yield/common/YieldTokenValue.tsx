import { type NetworkSymbol } from '@suite-common/wallet-config';
import { Row, Text } from '@trezor/components';
import { AssetLogo } from '@trezor/product-components';
import { BigNumber } from '@trezor/utils';

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

export const YieldTokenValue = ({ token, amount }: YieldTokenValueProps) => {
    const roundedAmount = new BigNumber(amount).decimalPlaces(2, BigNumber.ROUND_DOWN).toFixed();

    return (
        <Row alignItems="center" gap={8}>
            <AssetLogo
                size={24}
                symbol={token.networkSymbol}
                contractAddress={token.contractAddress}
                placeholder={token.symbol}
                showNetworkIcon
            />
            <Text typographyStyle="body-md-strong">
                <FormattedCryptoAmount value={roundedAmount} symbol={token.symbol} />
            </Text>
        </Row>
    );
};
