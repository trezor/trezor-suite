import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
    type FeedbackFeatureName,
    experimentalFeatureSet,
    translatedFeedbackFeatures,
} from '@suite/experimental';
import { Translation, useTranslation } from '@suite/intl';
import {
    type FeatureFeedbackRootState,
    type Rating,
    buildUserFeedbackData,
    selectPendingFeedbackFeature,
    sendFeedbackAction,
} from '@suite-common/feedback';
import { SidebarBanner } from '@trezor/product-components';

import { feedbackDismissed } from '../featureFeedbackSlice';
import { FeedbackFormModal } from './FeedbackFormModal';

export const FeedbackFormManager = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const dispatch = useDispatch();

    const { translationString } = useTranslation();
    const pendingFeature = useSelector((state: FeatureFeedbackRootState<FeedbackFeatureName>) =>
        selectPendingFeedbackFeature(state),
    );

    if (!pendingFeature) return null;

    const handleDismiss = () => {
        dispatch(feedbackDismissed(pendingFeature));
    };

    const handleSubmit = (rating: Rating, description: string) => {
        const userData = buildUserFeedbackData();

        dispatch(
            sendFeedbackAction({
                type: 'SUGGESTION',
                payload: {
                    category: (experimentalFeatureSet as ReadonlySet<string>).has(pendingFeature)
                        ? 'experimental'
                        : 'feature',
                    description,
                    rating,
                    feature: pendingFeature,
                    ...userData,
                },
            }),
        );
        dispatch(feedbackDismissed(pendingFeature));
    };

    if (isModalOpen) {
        return (
            <FeedbackFormModal
                feature={pendingFeature}
                onDismiss={() => setIsModalOpen(false)}
                onSubmit={handleSubmit}
            />
        );
    }

    return (
        <SidebarBanner
            ctaLabel={<Translation id="TR_FEATURE_FEEDBACK_CARD_RATE_BUTTON" />}
            closeLabel={<Translation id="TR_DISMISS" />}
            data-testid="@notification/feedback-banner"
            description={
                <Translation
                    id="TR_FEATURE_FEEDBACK_CARD_DESCRIPTION"
                    values={{
                        feature: pendingFeature,
                    }}
                />
            }
            heading={
                <Translation
                    id="TR_FEATURE_FEEDBACK_CARD_HEADING"
                    values={{
                        feature: translationString(translatedFeedbackFeatures[pendingFeature]),
                    }}
                />
            }
            icon="smiley"
            onClick={() => setIsModalOpen(true)}
            onClose={handleDismiss}
        />
    );
};
