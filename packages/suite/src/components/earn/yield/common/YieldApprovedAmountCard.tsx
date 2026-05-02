import { Translation } from '@suite/intl';
import type { YieldFlowDisplayToken } from '@suite-common/wallet-core';
import { Card, IconButton, Row, Spinner, Text } from '@trezor/components';
import { AssetLogo } from '@trezor/product-components';

import { FormattedCryptoAmount } from 'src/components/suite/FormattedCryptoAmount';

type YieldApprovedAmountCardProps = {
    token: YieldFlowDisplayToken;
    amount: string;
    isUnlimited?: boolean;
    isLoading?: boolean;
    hasError?: boolean;
    onRevoke?: () => void;
};

const getApprovedAmountValue = ({
    amount,
    isUnlimited,
    isLoading,
    hasError,
    symbol,
}: Pick<YieldApprovedAmountCardProps, 'amount' | 'isUnlimited' | 'isLoading' | 'hasError'> & {
    symbol: string;
}) => {
    if (isLoading) {
        return <Spinner size={16} isDisabled />;
    }

    if (hasError) {
        return <Text typographyStyle="body-md">-</Text>;
    }

    if (isUnlimited) {
        return (
            <Text typographyStyle="body-md">
                <Translation id="TR_APPROVE_AMOUNT_UNLIMITED" />
            </Text>
        );
    }

    return <FormattedCryptoAmount value={amount} symbol={symbol} />;
};

export const YieldApprovedAmountCard = ({
    token,
    amount,
    isUnlimited = false,
    isLoading = false,
    hasError = false,
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
                {getApprovedAmountValue({
                    amount,
                    isUnlimited,
                    isLoading,
                    hasError,
                    symbol: token.symbol,
                })}
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
