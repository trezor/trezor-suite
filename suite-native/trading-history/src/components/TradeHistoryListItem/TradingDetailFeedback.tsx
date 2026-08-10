import { useDispatch, useSelector } from 'react-redux';

import { useServices } from '@suite-common/dependency-injection';
import { selectSelectedDevice } from '@suite-common/device';
import { type Rating, buildUserFeedbackData, sendFeedbackAction } from '@suite-common/feedback';
import { selectCountryCode } from '@suite-common/geolocation';
import {
    formatExperimentVariantsForAnalytics,
    selectActiveExperimentsWithVariants,
} from '@suite-common/message-system';
import { type TradingType } from '@suite-common/trading';
import { events, selectNativeAnalyticsDep } from '@suite-native/analytics';
import { FeedbackCard } from '@suite-native/feedback-form';
import { Translation } from '@suite-native/intl';

type TradingDetailFeedbackProps = {
    type: TradingType;
    status?: string;
    provider?: string;
    id?: string;
    sendCurrency?: string;
    receiveCurrency?: string;
    country?: string;
};

export const TradingDetailFeedback = ({
    type,
    status,
    provider,
    id,
    sendCurrency,
    receiveCurrency,
    country,
}: TradingDetailFeedbackProps) => {
    const dispatch = useDispatch();
    const device = useSelector(selectSelectedDevice);
    const geolocation = useSelector(selectCountryCode);
    const activeExperimentsWithVariants = useSelector(selectActiveExperimentsWithVariants);
    const { analytics } = useServices(selectNativeAnalyticsDep);

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
            heading={<Translation id="feedbackForm.title" />}
            description={<Translation id="feedbackForm.description" />}
            submitLabel={<Translation id="feedbackForm.submitButton" />}
            successHeading={<Translation id="feedbackForm.successTitle" />}
            successDescription={<Translation id="feedbackForm.successDescription" />}
            closeLabel={<Translation id="generic.buttons.close" />}
            onSubmit={handleSubmit}
            onRatingSelect={handleRatingSelect}
        />
    );
};
