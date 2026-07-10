import { Translation } from '@suite/intl';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { Card, Row, Text } from '@trezor/components';
import { AssetLogo } from '@trezor/product-components';

import { FormattedCryptoAmount } from 'src/components/suite/FormattedCryptoAmount';

type YieldReceivingCardProps = {
    token: {
        networkSymbol: NetworkSymbol;
        symbol: string;
        contractAddress?: string | null;
    };
    amount: string;
};

/** "Receiving" summary row styled identically to YieldApprovedAmountCard. */
export const YieldReceivingCard = ({ token, amount }: YieldReceivingCardProps) => (
    <Card type="contrast" paddingType="small">
        <Row justifyContent="space-between" alignItems="center" width="100%">
            <Text typographyStyle="body-md">
                <Translation id="TR_EARN_YIELD_RECEIVING" />
            </Text>
            <Row alignItems="center" gap={8}>
                <AssetLogo
                    size={20}
                    symbol={token.networkSymbol}
                    contractAddress={token.contractAddress ?? null}
                    placeholder={token.symbol}
                    showNetworkIcon
                    isBordered={false}
                />
                <FormattedCryptoAmount value={amount} symbol={token.symbol} isBalance />
            </Row>
        </Row>
    </Card>
);
