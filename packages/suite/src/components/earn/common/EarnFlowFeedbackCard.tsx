import {
    feedbackRatingSelectedEvent,
    feedbackSentEvent,
    injectDesktopAnalytics,
} from '@suite/analytics';
import { FeedbackCard } from '@suite/feature-feedback';
import { Translation, type TranslationKey, useTranslation } from '@suite/intl';
import { events } from '@suite-common/analytics';
import { selectSelectedDevice } from '@suite-common/device';
import {
    type EarnFeedbackContext,
    type EarnFeedbackFeature,
    type Rating,
    buildUserFeedbackData,
    getEarnFeedbackPayloads,
    sendFeedbackThunk,
} from '@suite-common/feedback';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

import { useSelector } from '#src/hooks/suite/useSelector';

type EarnFlowFeedbackCardProps = {
    featureTitleId: TranslationKey;
    feature: EarnFeedbackFeature;
    context: string;
    feedbackContext: EarnFeedbackContext;
};

export const EarnFlowFeedbackCard = ({
    featureTitleId,
    feature,
    context,
    feedbackContext,
}: EarnFlowFeedbackCardProps) => {
    const { analytics, dispatch } = useServices(injectDesktopAnalytics, injectDispatch);
    const { translationString } = useTranslation();
    const device = useSelector(selectSelectedDevice);
    const feedbackPayloads = getEarnFeedbackPayloads({
        feature,
        context,
        details: feedbackContext,
    });

    const handleRatingSelect = (rating: Rating) => {
        analytics.report({
            type: feedbackRatingSelectedEvent.name,
            payload: { ...feedbackPayloads.analytics, rating },
        });
    };

    const handleSubmit = async (rating: Rating, description: string) => {
        await dispatch(
            sendFeedbackThunk({
                type: 'SUGGESTION',
                payload: {
                    ...feedbackPayloads.suggestion,
                    rating,
                    description,
                    ...buildUserFeedbackData(device),
                },
            }),
        ).unwrap();

        analytics.report({
            type: feedbackSentEvent.name,
            payload: feedbackPayloads.analytics,
        });

        if (feedbackPayloads.yieldInteraction) {
            analytics.report({
                type: events.yieldInteractionEvent.name,
                payload: {
                    element: 'feedback-submit',
                    value: rating,
                    ...feedbackPayloads.yieldInteraction,
                },
            });
        }
    };

    return (
        <FeedbackCard
            heading={
                <Translation
                    id="TR_FEATURE_FEEDBACK_CARD_HEADING"
                    values={{ feature: translationString(featureTitleId) }}
                />
            }
            description={<Translation id="TR_FEEDBACK_CARD_DESCRIPTION" />}
            submitLabel={<Translation id="TR_FEEDBACK_CARD_SEND_FEEDBACK" />}
            cancelLabel={<Translation id="TR_CANCEL" />}
            successHeading={<Translation id="TR_FEEDBACK_CARD_SUCCESS_TITLE" />}
            successDescription={<Translation id="TR_FEEDBACK_CARD_SUCCESS_DESCRIPTION" />}
            onSubmit={handleSubmit}
            onRatingSelect={handleRatingSelect}
        />
    );
};
