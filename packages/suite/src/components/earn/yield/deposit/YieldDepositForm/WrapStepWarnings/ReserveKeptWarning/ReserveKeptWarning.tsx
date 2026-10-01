import { Translation } from '@suite/intl';
import { Banner, Text } from '@trezor/components';

import { useReserveKeptWarning } from './hooks/useReserveKeptWarning';

export const ReserveKeptWarning = () => {
    const reserveKept = useReserveKeptWarning();

    if (!reserveKept) {
        return null;
    }

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
};
