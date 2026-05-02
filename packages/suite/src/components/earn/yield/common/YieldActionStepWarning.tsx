import { Translation } from '@suite/intl';
import { Banner, Button, Column, Text } from '@trezor/components';

import { type YieldNetworkFeeWarning } from '../yieldFlowUtils';

type YieldActionStepWarningProps = {
    isInsufficientFunds?: boolean;
    isApprovalInsufficient?: boolean;
    networkFeeWarning?: YieldNetworkFeeWarning | null;
    onModifyApproval?: () => void;
};

export const YieldActionStepWarning = ({
    isInsufficientFunds = false,
    isApprovalInsufficient = false,
    networkFeeWarning,
    onModifyApproval,
}: YieldActionStepWarningProps) => {
    if (isApprovalInsufficient) {
        return (
            <Banner
                intent="warning"
                description={
                    <Column gap={12}>
                        <Text>
                            <Translation id="TR_EARN_YIELD_APPROVAL_TOO_LOW" />
                        </Text>
                        {onModifyApproval && (
                            <Button size="small" intent="warning" onClick={onModifyApproval}>
                                <Translation id="TR_EARN_YIELD_MODIFY_APPROVAL" />
                            </Button>
                        )}
                    </Column>
                }
            />
        );
    }

    if (isInsufficientFunds) {
        return (
            <Banner
                intent="warning"
                description={
                    <Text>
                        <Translation id="AMOUNT_IS_NOT_ENOUGH" />
                    </Text>
                }
            />
        );
    }

    if (networkFeeWarning) {
        return (
            <Banner
                intent="warning"
                icon="warning"
                description={
                    <Column gap={4}>
                        <Text>
                            <Translation
                                id="TR_EARN_YIELD_NETWORK_FEE_WARNING_TITLE"
                                values={{
                                    amount: networkFeeWarning.availableAmount,
                                    networkDisplaySymbol: networkFeeWarning.networkDisplaySymbol,
                                }}
                            />
                        </Text>
                        <Text>
                            <Translation
                                id="TR_EARN_YIELD_NETWORK_FEE_WARNING_DESCRIPTION"
                                values={{
                                    networkDisplaySymbol: networkFeeWarning.networkDisplaySymbol,
                                }}
                            />
                        </Text>
                    </Column>
                }
            />
        );
    }

    return null;
};
