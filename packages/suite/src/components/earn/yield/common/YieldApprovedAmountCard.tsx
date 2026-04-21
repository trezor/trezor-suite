import { Translation } from '@suite/intl';
import type { YieldFlowDisplayToken } from '@suite-common/wallet-core';
import { Card, IconButton, Row, Text } from '@trezor/components';
import { AssetLogo } from '@trezor/product-components';

import { FormattedCryptoAmount } from 'src/components/suite/FormattedCryptoAmount';

type YieldApprovedAmountCardProps = {
    token: YieldFlowDisplayToken;
    amount: string;
    onRevoke?: () => void;
};

export const YieldApprovedAmountCard = ({
    token,
    amount,
    onRevoke,
}: YieldApprovedAmountCardProps) => (
    <Card fillType="flat" paddingType="small">
        <Row justifyContent="space-between" alignItems="center" width="100%">
            <Text typographyStyle="body-md">
                <Translation id="TR_EARN_YIELD_APPROVED_AMOUNT" />
            </Text>
            <Row alignItems="center" gap={8}>
                <AssetLogo
                    size={20}
                    symbol={token.networkSymbol}
                    contractAddress={token.contractAddress ?? null}
                    placeholder={token.symbol}
                    showNetworkIcon
                />
                <FormattedCryptoAmount value={amount} symbol={token.symbol} />
                {onRevoke && (
                    <IconButton
                        icon="x"
                        size="small"
                        intent="neutral"
                        priority="secondary"
                        onClick={onRevoke}
                    />
                )}
            </Row>
        </Row>
    </Card>
);
