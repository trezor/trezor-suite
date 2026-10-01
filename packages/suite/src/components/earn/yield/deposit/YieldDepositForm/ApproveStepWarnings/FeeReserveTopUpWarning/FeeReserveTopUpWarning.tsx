import { Translation } from '@suite/intl';
import { Banner, Text } from '@trezor/components';

import { useFeeReserveTopUpWarning } from './hooks/useFeeReserveTopUpWarning';

export const FeeReserveTopUpWarning = () => {
    const feeReserveTopUp = useFeeReserveTopUpWarning();

    if (!feeReserveTopUp) {
        return null;
    }

    return (
        <Banner
            intent="info"
            data-testid="@yield/warning/fee-reserve-top-up"
            description={
                <Text>
                    <Translation
                        id="TR_EARN_YIELD_FEE_RESERVE_TOP_UP_RECOMMENDED"
                        values={{
                            amount: feeReserveTopUp.amount,
                            nativeSymbol: feeReserveTopUp.nativeSymbol,
                        }}
                    />
                </Text>
            }
        />
    );
};
