import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { type FeedbackFeatureName, experimentalFeatureSet } from '@suite/experimental';
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
import { RateYourExperience } from './RateYourExperience';

export const FeedbackFormManager = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const dispatch = useDispatch();
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
        <SidebarBanner onClose={handleDismiss} data-testid="@notification/feedback-banner">
            <RateYourExperience
                feature={pendingFeature}
                onRate={() => setIsModalOpen(true)}
                onSkip={handleDismiss}
                showSkipButton={false}
            />
        </SidebarBanner>
    );
};
