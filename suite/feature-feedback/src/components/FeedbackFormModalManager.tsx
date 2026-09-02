import { useState } from 'react';
import { useSelector } from 'react-redux';

import {
    type FeedbackFeatureName,
    experimentalFeedbackFeatureSet,
    translatedFeedbackFeatures,
} from '@suite/experimental';
import { Translation, useTranslation } from '@suite/intl';
import {
    type FeatureFeedbackRootState,
    type Rating,
    buildUserFeedbackData,
    selectPendingFeedbackFeature,
    sendFeedbackThunk,
} from '@suite-common/feedback';
import { useDispatch } from '@suite-common/redux-utils';
import { SmileyIcon } from '@trezor/icons';
import { SidebarBanner } from '@trezor/product-components';

import { feedbackDismissed } from '../featureFeedbackSlice';
import { FeedbackFormModal } from './FeedbackFormModal';

type FeedbackSidebarBannerRootState = FeatureFeedbackRootState<FeedbackFeatureName>;

export const selectShouldShowFeedbackSidebarBanner = (state: FeedbackSidebarBannerRootState) =>
    selectPendingFeedbackFeature(state) !== null;

export const FeedbackFormManager = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const dispatch = useDispatch();

    const { translationString } = useTranslation();
    const pendingFeature = useSelector((state: FeedbackSidebarBannerRootState) =>
        selectPendingFeedbackFeature(state),
    );

    if (!pendingFeature) {
        return null;
    }

    const handleDismiss = () => {
        dispatch(feedbackDismissed(pendingFeature));
    };

    const handleSubmit = (rating: Rating, description: string) => {
        const userData = buildUserFeedbackData();

        dispatch(
            sendFeedbackThunk({
                type: 'SUGGESTION',
                payload: {
                    category: (experimentalFeedbackFeatureSet as ReadonlySet<string>).has(
                        pendingFeature,
                    )
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
            icon={SmileyIcon}
            onClick={() => setIsModalOpen(true)}
            onClose={handleDismiss}
        />
    );
};
