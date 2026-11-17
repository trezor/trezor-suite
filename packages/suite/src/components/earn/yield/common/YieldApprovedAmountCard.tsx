import { AssetIcon } from '@suite/assets';
import { Translation } from '@suite/intl';
import type { YieldFlowDisplayToken } from '@suite-common/wallet-core';
import { Card, IconButton, Row, Text } from '@trezor/components';
import { XIcon } from '@trezor/icons';

import { AllowanceAmount } from '#src/components/wallet/Allowance/AllowanceAmount';

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
    const { networkSymbol, contractAddress } = token;

    if (!amount || amount.trim() === '' || amount === '0' || !contractAddress) return null;

    return (
        <Card type="contrast" paddingType="small">
            <Row justifyContent="space-between" alignItems="center" width="100%">
                <Text typographyStyle="body-md">
                    <Translation id="TR_EARN_YIELD_APPROVED_AMOUNT" />
                </Text>
                <Row alignItems="center" gap={8}>
                    <AssetIcon
                        size={20}
                        networkSymbol={networkSymbol}
                        contractAddress={contractAddress}
                        showNetworkIcon
                        isBordered={false}
                    />
                    <AllowanceAmount
                        amount={amount}
                        networkSymbol={networkSymbol}
                        contractAddress={contractAddress}
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
