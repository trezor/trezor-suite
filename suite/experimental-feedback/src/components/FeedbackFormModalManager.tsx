import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import type { ExperimentalFeature } from '@suite/experimental';
import {
    type ExperimentalFeedbackRootState,
    type Rating,
    buildUserFeedbackData,
    selectPendingFeedbackFeature,
    sendFeedbackAction,
} from '@suite-common/feedback';

import { feedbackDismissed } from '../experimentalFeedbackSlice';
import { FeedbackFormModal } from './FeedbackFormModal';
import { RateYourExperienceCard } from './RateYourExperienceCard';

export const FeedbackFormManager = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const dispatch = useDispatch();
    const pendingFeature = useSelector(
        (state: ExperimentalFeedbackRootState<ExperimentalFeature>) =>
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
                    category: 'experimental',
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
        <RateYourExperienceCard
            feature={pendingFeature}
            onRate={() => setIsModalOpen(true)}
            onSkip={handleDismiss}
        />
    );
};
