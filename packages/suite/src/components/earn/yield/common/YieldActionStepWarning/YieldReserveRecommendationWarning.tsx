import { Translation } from '@suite/intl';
import { Banner, Text } from '@trezor/components';

type YieldReserveRecommendation = { amount: string; nativeSymbol: string };

export type { YieldReserveRecommendation };

type YieldReserveRecommendationWarningProps = {
    reserveRecommendation: YieldReserveRecommendation;
};

export function YieldReserveRecommendationWarning({
    reserveRecommendation,
}: YieldReserveRecommendationWarningProps) {
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
