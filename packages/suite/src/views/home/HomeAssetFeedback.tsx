import { events, injectDesktopAnalytics } from '@suite/analytics';
import { FeedbackCard } from '@suite/feature-feedback';
import { Translation } from '@suite/intl';
import {
    HOME_ASSET_TABLE_FEEDBACK_CATEGORY,
    HOME_ASSET_TABLE_FEEDBACK_CONTEXT,
    selectShownWalletAssetKeys,
    sendHomeAssetTableFeedbackThunk,
} from '@suite-common/assets';
import { type Rating } from '@suite-common/feedback';
import {
    closeHomeAssetTableFeedback,
    selectIsHomeAssetTableFeedbackClosed,
} from '@suite-common/wallet-core';
import { Box, GhostContainer, Icon } from '@trezor/components';
import { useServices } from '@trezor/dependency-injection';
import { XIcon } from '@trezor/icons';
import { injectDispatch } from '@trezor/redux-utils';

import { useSelector } from 'src/hooks/suite';

export const HomeAssetFeedback = () => {
    const isClosed = useSelector(selectIsHomeAssetTableFeedbackClosed);
    const assetKeys = useSelector(selectShownWalletAssetKeys);
    const { analytics, dispatch } = useServices(injectDesktopAnalytics, injectDispatch);

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
        dispatch(sendHomeAssetTableFeedbackThunk({ rating, description }));

        analytics.report({
            type: events.feedbackSentEvent.name,
            payload: {
                category: HOME_ASSET_TABLE_FEEDBACK_CATEGORY,
                context: HOME_ASSET_TABLE_FEEDBACK_CONTEXT,
            },
        });
    };

    if (isClosed || assetKeys.length === 0) {
        return null;
    }

    return (
        <Box position={{ type: 'relative' }} data-testid="@dashboard/home-asset/feedback">
            <FeedbackCard
                heading={<Translation id="TR_HOME_ASSET_FEEDBACK_TITLE" />}
                description={<Translation id="TR_FEEDBACK_CARD_DESCRIPTION" />}
                submitLabel={<Translation id="TR_FEEDBACK_CARD_SEND_FEEDBACK" />}
                cancelLabel={<Translation id="TR_CANCEL" />}
                successHeading={<Translation id="TR_FEEDBACK_CARD_SUCCESS_TITLE" />}
                successDescription={<Translation id="TR_FEEDBACK_CARD_SUCCESS_DESCRIPTION" />}
                onSubmit={handleSubmit}
                onRatingSelect={handleRatingSelect}
                isStacked
            />

            <Box position={{ type: 'absolute', top: 16, right: 16 }}>
                <GhostContainer
                    padding={4}
                    borderRadius={6}
                    onClick={() => dispatch(closeHomeAssetTableFeedback())}
                    data-testid="@dashboard/home-asset/feedback/dismiss"
                >
                    <Icon as={XIcon} size={16} intent="neutral" priority="secondary" />
                </GhostContainer>
            </Box>
        </Box>
    );
};
