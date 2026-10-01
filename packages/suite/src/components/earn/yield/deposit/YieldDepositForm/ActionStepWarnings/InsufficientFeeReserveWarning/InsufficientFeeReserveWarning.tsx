import { Translation } from '@suite/intl';
import { Banner, Text } from '@trezor/components';

import { useInsufficientFeeReserveWarning } from './hooks/useInsufficientFeeReserveWarning';

export const InsufficientFeeReserveWarning = () => {
    const insufficientFeeReserve = useInsufficientFeeReserveWarning();

    if (!insufficientFeeReserve) {
        return null;
    }

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
};
