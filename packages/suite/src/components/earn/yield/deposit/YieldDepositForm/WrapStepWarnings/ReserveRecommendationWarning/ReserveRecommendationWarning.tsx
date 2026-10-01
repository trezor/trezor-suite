import { Translation } from '@suite/intl';
import { Banner, Text } from '@trezor/components';

import { useReserveRecommendationWarning } from './hooks/useReserveRecommendationWarning';

export const ReserveRecommendationWarning = () => {
    const reserveRecommendation = useReserveRecommendationWarning();

    if (!reserveRecommendation) {
        return null;
    }

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
};
