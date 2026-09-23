import { events, injectDesktopAnalytics } from '@suite/analytics';
import { useDevice } from '@suite/device';
import { Translation } from '@suite/intl';
import { useServices } from '@suite-common/dependency-injection';
import { type Rating, buildUserFeedbackData, sendFeedbackThunk } from '@suite-common/feedback';
import {
    formatExperimentVariantsForAnalytics,
    selectActiveExperimentsWithVariants,
} from '@suite-common/message-system';
import { injectDispatch } from '@suite-common/redux-utils';
import { FeedbackCard } from '@trezor/product-components';

import { useSelector } from 'src/hooks/suite';

// What the feedback is about, as the feedback and the analytics both name it.
const FEEDBACK_CONTEXT = 'assetFirstTable';

export const AssetFirstFeedback = () => {
    const { device } = useDevice();
    const activeExperimentsWithVariants = useSelector(selectActiveExperimentsWithVariants);
    const { analytics, dispatch } = useServices(injectDesktopAnalytics, injectDispatch);

    const handleRatingSelect = (rating: Rating) => {
        analytics.report({
            type: events.feedbackRatingSelectedEvent.name,
            payload: { rating, category: 'dashboard', context: FEEDBACK_CONTEXT },
        });
    };

    const handleSubmit = (rating: Rating, description: string) => {
        dispatch(
            sendFeedbackThunk({
                type: 'SUGGESTION',
                payload: {
                    category: 'dashboard',
                    description,
                    rating,
                    context: FEEDBACK_CONTEXT,
                    feature: FEEDBACK_CONTEXT,
                    activeExperimentsWithVariants: formatExperimentVariantsForAnalytics(
                        activeExperimentsWithVariants,
                    ),
                    ...buildUserFeedbackData(device),
                },
            }),
        );

        analytics.report({
            type: events.feedbackSentEvent.name,
            payload: { category: 'dashboard', context: FEEDBACK_CONTEXT },
        });
    };

    return (
        <FeedbackCard
            heading={<Translation id="TR_ASSET_FIRST_FEEDBACK_TITLE" />}
            description={<Translation id="TR_FEEDBACK_CARD_DESCRIPTION" />}
            submitLabel={<Translation id="TR_FEEDBACK_CARD_SEND_FEEDBACK" />}
            cancelLabel={<Translation id="TR_CANCEL" />}
            successHeading={<Translation id="TR_FEEDBACK_CARD_SUCCESS_TITLE" />}
            successDescription={<Translation id="TR_FEEDBACK_CARD_SUCCESS_DESCRIPTION" />}
            onSubmit={handleSubmit}
            onRatingSelect={handleRatingSelect}
            isStacked
        />
    );
};
