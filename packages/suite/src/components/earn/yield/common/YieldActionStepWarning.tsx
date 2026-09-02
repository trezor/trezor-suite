import { Translation } from '@suite/intl';
import { Banner, Button, Column, Text } from '@trezor/components';

type YieldActionStepWarningProps = {
    isInsufficientFunds?: boolean;
    isApprovalInsufficient?: boolean;
    isApproveOverBalance?: boolean;
    /** Non-blocking recommendation to keep a native-coin reserve aside for the follow-up fees. */
    reserveRecommendation?: { amount: string; nativeSymbol: string };
    onModifyApproval?: () => void;
};

export const YieldActionStepWarning = ({
    isInsufficientFunds = false,
    isApprovalInsufficient = false,
    isApproveOverBalance = false,
    reserveRecommendation,
    onModifyApproval,
}: YieldActionStepWarningProps) => {
    if (reserveRecommendation) {
        return (
            <Banner
                intent="info"
                description={
                    <Text>
                        <Translation
                            id="TR_EARN_YIELD_WRAP_RESERVE_RECOMMENDED"
                            values={{
                                amount: reserveRecommendation.amount,
                                nativeSymbol: reserveRecommendation.nativeSymbol,
                            }}
                        />
                    </Text>
                }
            />
        );
    }

    if (isApproveOverBalance) {
        return (
            <Banner
                intent="info"
                description={
                    <Text>
                        <Translation id="TR_APPROVE_OVER_BALANCE" />
                    </Text>
                }
            />
        );
    }

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

    return null;
};
