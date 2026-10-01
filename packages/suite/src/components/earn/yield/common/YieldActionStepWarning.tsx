import { Translation } from '@suite/intl';
import { Banner, Text } from '@trezor/components';

type YieldFeeReserveNotice = { amount: string; nativeSymbol: string };

type YieldActionStepWarningProps = {
    isInsufficientFunds?: boolean;
    /** Blocking: the native balance does not cover the fee reserve of the flow. */
    insufficientFeeReserve?: YieldFeeReserveNotice;
    /** Confirmation that the Max amount left exactly the native-coin reserve for the follow-up fees. */
    reserveKept?: YieldFeeReserveNotice;
    /** Non-blocking recommendation to keep a native-coin reserve aside for the follow-up fees. */
    reserveRecommendation?: YieldFeeReserveNotice;
};

export const YieldActionStepWarning = ({
    isInsufficientFunds = false,
    insufficientFeeReserve,
    reserveKept,
    reserveRecommendation,
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

    return null;
};
