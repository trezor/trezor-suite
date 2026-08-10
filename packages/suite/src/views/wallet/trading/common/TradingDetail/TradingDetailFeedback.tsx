import {
    type BuyTradeStatus,
    type ExchangeProviderInfo,
    type ExchangeTradeStatus,
    type SellTradeStatus,
} from 'invity-api';

import { events, selectDesktopAnalyticsDep } from '@suite/analytics';
import { useDevice } from '@suite/device';
import { Translation } from '@suite/intl';
import { useServices } from '@suite-common/dependency-injection';
import { type Rating, buildUserFeedbackData, sendFeedbackAction } from '@suite-common/feedback';
import { selectCountryCode } from '@suite-common/geolocation';
import {
    formatExperimentVariantsForAnalytics,
    selectActiveExperimentsWithVariants,
} from '@suite-common/message-system';
import { type TradingType } from '@suite-common/trading';
import { FeedbackCard } from '@trezor/product-components';

import { useDispatch, useSelector } from 'src/hooks/suite';
import { type TradingGetCryptoQuoteAmountProps } from 'src/types/trading/trading';

interface TradingDetailFeedbackProps {
    status: ExchangeTradeStatus | SellTradeStatus | BuyTradeStatus | undefined;
    type: TradingType;
    provider?: ExchangeProviderInfo['name'];
    id?: string;
    quoteAmounts: TradingGetCryptoQuoteAmountProps;
    country?: string;
}

export const TradingDetailFeedback = ({
    status,
    type,
    provider,
    id,
    quoteAmounts: { sendCurrency, receiveCurrency },
    country,
}: TradingDetailFeedbackProps) => {
    const { device } = useDevice();
    const dispatch = useDispatch();
    const geolocation = useSelector(selectCountryCode);
    const activeExperimentsWithVariants = useSelector(selectActiveExperimentsWithVariants);
    const { analytics } = useServices(selectDesktopAnalyticsDep);

    const handleRatingSelect = (rating: Rating) => {
        analytics.report({
            type: events.feedbackRatingSelectedEvent.name,
            payload: { rating, category: 'trade', context: type, provider },
        });
    };

    const handleSubmit = (rating: Rating, description: string) => {
        const userData = buildUserFeedbackData(device);

        dispatch(
            sendFeedbackAction({
                type: 'SUGGESTION',
                payload: {
                    category: 'trade',
                    description,
                    rating,
                    status,
                    provider,
                    id,
                    type,
                    sendCurrency,
                    receiveCurrency,
                    geolocation: geolocation || undefined,
                    countryOfResidence: country || undefined,
                    activeExperimentsWithVariants: formatExperimentVariantsForAnalytics(
                        activeExperimentsWithVariants,
                    ),
                    ...userData,
                },
            }),
        );

        analytics.report({
            type: events.feedbackSentEvent.name,
            payload: { category: 'trade', context: type, provider },
        });
    };

    return (
        <FeedbackCard
            heading={<Translation id="TR_EXCHANGE_DETAIL_FEEDBACK_TITLE" />}
            description={<Translation id="TR_FEEDBACK_CARD_DESCRIPTION" />}
            submitLabel={<Translation id="TR_FEEDBACK_CARD_SEND" />}
            successHeading={<Translation id="TR_FEEDBACK_CARD_SUCCESS_TITLE" />}
            successDescription={<Translation id="TR_FEEDBACK_CARD_SUCCESS_DESCRIPTION" />}
            onSubmit={handleSubmit}
            onRatingSelect={handleRatingSelect}
        />
    );
};
