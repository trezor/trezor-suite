import { events, injectDesktopAnalytics } from '@suite/analytics';
import { useDevice } from '@suite/device';
import { selectIsHomeAssetTableFeedbackClosed, setFlag } from '@suite/flags';
import { Translation } from '@suite/intl';
import { selectShownWalletAssetKeys } from '@suite-common/assets';
import { useServices } from '@suite-common/dependency-injection';
import { type Rating, buildUserFeedbackData, sendFeedbackThunk } from '@suite-common/feedback';
import {
    formatExperimentVariantsForAnalytics,
    selectActiveExperimentsWithVariants,
} from '@suite-common/message-system';
import { injectDispatch } from '@suite-common/redux-utils';
import { Box, GhostContainer, Icon } from '@trezor/components';
import { XIcon } from '@trezor/icons';
import { FeedbackCard } from '@trezor/product-components';

import { useSelector } from 'src/hooks/suite';

const FEEDBACK_CONTEXT = 'homeAssetTable';

export const HomeAssetFeedback = () => {
    const { device } = useDevice();
    const activeExperimentsWithVariants = useSelector(selectActiveExperimentsWithVariants);
    const isClosed = useSelector(selectIsHomeAssetTableFeedbackClosed);
    const assetKeys = useSelector(selectShownWalletAssetKeys);
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

    if (isClosed || assetKeys.length === 0) {
        return null;
    }

    return (
        <Box position={{ type: 'relative' }}>
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
                    onClick={() =>
                        dispatch(setFlag({ key: 'homeAssetTableFeedbackClosed', value: true }))
                    }
                    data-testid="@dashboard/home-asset/feedback/dismiss"
                >
                    <Icon as={XIcon} size={16} intent="neutral" priority="secondary" />
                </GhostContainer>
            </Box>
        </Box>
    );
};
