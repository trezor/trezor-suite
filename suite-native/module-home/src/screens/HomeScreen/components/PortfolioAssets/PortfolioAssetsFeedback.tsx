import { useCallback, useState } from 'react';
import { useSelector } from 'react-redux';

import { useFocusEffect } from '@react-navigation/native';

import {
    HOME_ASSET_TABLE_FEEDBACK_CATEGORY,
    HOME_ASSET_TABLE_FEEDBACK_CONTEXT,
    selectHasShownWalletAssets,
    sendHomeAssetTableFeedbackThunk,
} from '@suite-common/assets';
import { type Rating } from '@suite-common/feedback';
import {
    closeHomeAssetTableFeedback,
    selectIsHomeAssetTableFeedbackClosed,
} from '@suite-common/wallet-core';
import { events, injectNativeAnalytics } from '@suite-native/analytics';
import { CollapsibleBox } from '@suite-native/atoms';
import { FeedbackCard } from '@suite-native/feedback-form';
import { Translation } from '@suite-native/intl';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

export const PortfolioAssetsFeedback = () => {
    const isClosed = useSelector(selectIsHomeAssetTableFeedbackClosed);
    const hasAssets = useSelector(selectHasShownWalletAssets);
    const { analytics, dispatch } = useServices(injectNativeAnalytics, injectDispatch);
    const [isSubmitted, setIsSubmitted] = useState(false);

    useFocusEffect(useCallback(() => () => setIsSubmitted(false), []));

    const handleRatingSelect = (rating: Rating) => {
        analytics.report({
            type: events.feedbackRatingSelectedEvent.name,
            payload: {
                rating,
                category: HOME_ASSET_TABLE_FEEDBACK_CATEGORY,
                context: HOME_ASSET_TABLE_FEEDBACK_CONTEXT,
            },
        });
    };

    const handleSubmit = (rating: Rating, description: string) => {
        setIsSubmitted(true);
        dispatch(sendHomeAssetTableFeedbackThunk({ rating, description }));

        analytics.report({
            type: events.feedbackSentEvent.name,
            payload: {
                category: HOME_ASSET_TABLE_FEEDBACK_CATEGORY,
                context: HOME_ASSET_TABLE_FEEDBACK_CONTEXT,
            },
        });
    };

    const handleDismiss = () => {
        setIsSubmitted(false);
        dispatch(closeHomeAssetTableFeedback());
    };

    if (!hasAssets) {
        return null;
    }

    return (
        <CollapsibleBox
            isCollapsed={isClosed && !isSubmitted}
            paddingHorizontal="sp16"
            paddingVertical="sp16"
            testID="@home/portfolio-assets/feedback"
        >
            <FeedbackCard
                heading={<Translation id="moduleHome.assets.feedback.title" />}
                headingVariant="body-md-strong"
                description={<Translation id="feedbackForm.description" />}
                submitLabel={<Translation id="feedbackForm.submitButton" />}
                successHeading={<Translation id="feedbackForm.successTitle" />}
                successDescription={<Translation id="feedbackForm.successDescription" />}
                closeLabel={<Translation id="generic.buttons.close" />}
                onSubmit={handleSubmit}
                onRatingSelect={handleRatingSelect}
                onDismiss={handleDismiss}
            />
        </CollapsibleBox>
    );
};
