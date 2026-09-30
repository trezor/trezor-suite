import { Translation } from '@suite/intl';
import { Banner, Button, Column, Text } from '@trezor/components';

type YieldFeeReserveNotice = { amount: string; nativeSymbol: string };

type YieldActionStepWarningProps = {
    isInsufficientFunds?: boolean;
    isApprovalInsufficient?: boolean;
    isApproveOverBalance?: boolean;
    /** Blocking: the native balance does not cover the fee reserve of the flow. */
    insufficientFeeReserve?: YieldFeeReserveNotice;
    /** Confirmation that the Max amount left exactly the native-coin reserve for the follow-up fees. */
    reserveKept?: YieldFeeReserveNotice;
    /** Non-blocking recommendation to keep a native-coin reserve aside for the follow-up fees. */
    reserveRecommendation?: YieldFeeReserveNotice;
    /** Non-blocking recommendation to top the native coin up for the exit fees. */
    feeReserveTopUpRecommendation?: YieldFeeReserveNotice;
    onModifyApproval?: () => void;
};

export const YieldActionStepWarning = ({
    isInsufficientFunds = false,
    isApprovalInsufficient = false,
    isApproveOverBalance = false,
    insufficientFeeReserve,
    reserveKept,
    reserveRecommendation,
    feeReserveTopUpRecommendation,
    onModifyApproval,
}: YieldActionStepWarningProps) => {
    if (insufficientFeeReserve) {
        return (
            <Banner
                intent="warning"
                data-testid="@yield/warning/insufficient-fee-reserve"
                description={
                    <Text>
                        <Translation
                            id="TR_EARN_YIELD_INSUFFICIENT_FEE_RESERVE"
                            values={{
                                amount: insufficientFeeReserve.amount,
                                nativeSymbol: insufficientFeeReserve.nativeSymbol,
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
                data-testid="@yield/warning/approve-over-balance"
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
                data-testid="@yield/warning/approval-too-low"
                description={
                    <Column gap={12}>
                        <Text>
                            <Translation id="TR_EARN_YIELD_APPROVAL_TOO_LOW" />
                        </Text>
                        {onModifyApproval && (
                            <Button
                                size="small"
                                intent="warning"
                                onClick={onModifyApproval}
                                data-testid="@yield/warning/modify-approval-button"
                            >
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
                data-testid="@yield/warning/insufficient-funds"
                description={
                    <Text>
                        <Translation id="AMOUNT_IS_NOT_ENOUGH" />
                    </Text>
                }
            />
        );
    }

    if (reserveKept) {
        return (
            <Banner
                intent="info"
                data-testid="@yield/warning/reserve-kept"
                description={
                    <Text>
                        <Translation
                            id="TR_EARN_YIELD_WRAP_RESERVE_KEPT"
                            values={{
                                amount: reserveKept.amount,
                                nativeSymbol: reserveKept.nativeSymbol,
                            }}
                        />
                    </Text>
                }
            />
        );
    }

    if (reserveRecommendation) {
        return (
            <Banner
                intent="info"
                data-testid="@yield/warning/reserve-recommendation"
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

    if (feeReserveTopUpRecommendation) {
        return (
            <Banner
                intent="info"
                data-testid="@yield/warning/fee-reserve-top-up"
                description={
                    <Text>
                        <Translation
                            id="TR_EARN_YIELD_FEE_RESERVE_TOP_UP_RECOMMENDED"
                            values={{
                                amount: feeReserveTopUpRecommendation.amount,
                                nativeSymbol: feeReserveTopUpRecommendation.nativeSymbol,
                            }}
                        />
                    </Text>
                }
            />
        );
    }

    return null;
};
