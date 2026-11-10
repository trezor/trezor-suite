import { Translation } from '@suite/intl';
import type { YieldFlowDisplayToken } from '@suite-common/wallet-core';
import { Card, IconButton, Row, Text } from '@trezor/components';
import { XIcon } from '@trezor/icons';
import { TokenIcon } from '@trezor/product-components';

import { AllowanceAmount } from '../../../wallet/Allowance/AllowanceAmount';

type YieldApprovedAmountCardProps = {
    token: YieldFlowDisplayToken;
    amount?: string;
    isLoading?: boolean;
    hasError?: boolean;
    onRevoke?: () => void;
};

export const YieldApprovedAmountCard = ({
    token,
    amount,
    isLoading = false,
    hasError = false,
    onRevoke,
}: YieldApprovedAmountCardProps) => {
    if (!amount || amount.trim() === '' || amount === '0') return null;

    return (
        <Card type="contrast" paddingType="small">
            <Row justifyContent="space-between" alignItems="center" width="100%">
                <Text typographyStyle="body-md">
                    <Translation id="TR_EARN_YIELD_APPROVED_AMOUNT" />
                </Text>
                <Row alignItems="center" gap={8}>
                    <TokenIcon
                        size={20}
                        symbol={token.networkSymbol}
                        contractAddress={token.contractAddress ?? null}
                        placeholder={token.symbol}
                        showNetworkIcon
                        isBordered={false}
                    />
                    <AllowanceAmount
                        amount={amount}
                        symbol={token.symbol}
                        decimals={token.decimals}
                        contractAddress={token.contractAddress}
                        isLoading={isLoading}
                        hasError={hasError}
                        data-testid="@yield/approve/approved-amount"
                    />
                    {onRevoke && (
                        <IconButton
                            icon={XIcon}
                            size="small"
                            intent="neutral"
                            priority="secondary"
                            onClick={onRevoke}
                            tooltip={{ content: <Translation id="TR_REVOKE_DATA_TITLE" /> }}
                        />
                    )}
                </Row>
            </Row>
        </Card>
    );
};
