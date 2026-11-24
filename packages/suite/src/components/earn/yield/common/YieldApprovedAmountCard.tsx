import { AssetIcon } from '@suite/assets';
import { Translation } from '@suite/intl';
import { createAssetId } from '@suite-common/asset-types';
import { toTokenAddress } from '@suite-common/tokens';
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
    if (!amount || amount.trim() === '' || amount === '0' || !token.contractAddress) return null;

    const contractAddress = toTokenAddress(token.contractAddress);

    return (
        <Card type="contrast" paddingType="small">
            <Row justifyContent="space-between" alignItems="center" width="100%">
                <Text typographyStyle="body-md">
                    <Translation id="TR_EARN_YIELD_APPROVED_AMOUNT" />
                </Text>
                <Row alignItems="center" gap={8}>
                    <AssetIcon
                        size={20}
                        assetId={createAssetId({
                            networkSymbol: token.networkSymbol,
                            contractAddress,
                        })}
                        showNetworkIcon
                        isBordered={false}
                    />
                    <AllowanceAmount
                        amount={amount}
                        networkSymbol={token.networkSymbol}
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
