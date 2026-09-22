import {
    feedbackRatingSelectedEvent,
    feedbackSentEvent,
    injectDesktopAnalytics,
} from '@suite/analytics';
import { Translation, type TranslationKey, useTranslation } from '@suite/intl';
import { useServices } from '@suite-common/dependency-injection';
import {
    type FeedbackCategory,
    type Rating,
    buildUserFeedbackData,
    sendFeedbackThunk,
} from '@suite-common/feedback';
import { injectDispatch } from '@suite-common/redux-utils';
import { FeedbackCard } from '@trezor/product-components';

type EarnFlowFeedbackCardProps = {
    featureTitleId: TranslationKey;
    analyticsCategory: FeedbackCategory;
    context: string;
    provider?: string;
    feature: string;
    onSubmit?: (rating: Rating) => void;
};

export const EarnFlowFeedbackCard = ({
    featureTitleId,
    analyticsCategory,
    context,
    provider,
    feature,
    onSubmit,
}: EarnFlowFeedbackCardProps) => {
    const { analytics, dispatch } = useServices(injectDesktopAnalytics, injectDispatch);
    const { translationString } = useTranslation();

    const handleRatingSelect = (rating: Rating) => {
        analytics.report({
            type: feedbackRatingSelectedEvent.name,
            payload: { rating, category: analyticsCategory, context, provider },
        });
    };

    const handleSubmit = (rating: Rating, description: string) => {
        onSubmit?.(rating);

        dispatch(
            sendFeedbackThunk({
                type: 'SUGGESTION',
                payload: {
                    category: 'feature',
                    feature,
                    rating,
                    description,
                    ...buildUserFeedbackData(),
                },
            }),
        );

        analytics.report({
            type: feedbackSentEvent.name,
            payload: { category: analyticsCategory, context, provider },
        });
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
