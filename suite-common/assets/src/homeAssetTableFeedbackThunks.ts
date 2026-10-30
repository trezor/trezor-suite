import { type DeviceRootState, selectSelectedDevice } from '@suite-common/device';
import {
    type FeedbackCategory,
    type Rating,
    buildUserFeedbackData,
    sendFeedbackThunk,
} from '@suite-common/feedback';
import {
    formatExperimentVariantsForAnalytics,
    selectActiveExperimentsWithVariants,
} from '@suite-common/message-system';
import { closeHomeAssetTableFeedback } from '@suite-common/wallet-core';
import { createThunk } from '@trezor/redux-utils';

export const HOME_ASSET_TABLE_FEEDBACK_CATEGORY: FeedbackCategory = 'dashboard';
export const HOME_ASSET_TABLE_FEEDBACK_CONTEXT = 'homeAssetTable';

export type SendHomeAssetTableFeedbackThunkState = DeviceRootState &
    Parameters<typeof selectActiveExperimentsWithVariants>[0];

export const sendHomeAssetTableFeedbackThunk = createThunk<
    void,
    { rating: Rating; description: string },
    { state: SendHomeAssetTableFeedbackThunkState }
>(
    '@suite-common/assets/sendHomeAssetTableFeedback',
    async ({ rating, description }, { dispatch, getState }) => {
        const result = await dispatch(
            sendFeedbackThunk({
                type: 'SUGGESTION',
                payload: {
                    category: HOME_ASSET_TABLE_FEEDBACK_CATEGORY,
                    description,
                    rating,
                    context: HOME_ASSET_TABLE_FEEDBACK_CONTEXT,
                    feature: HOME_ASSET_TABLE_FEEDBACK_CONTEXT,
                    activeExperimentsWithVariants: formatExperimentVariantsForAnalytics(
                        selectActiveExperimentsWithVariants(getState()),
                    ),
                    ...buildUserFeedbackData(selectSelectedDevice(getState())),
                },
            }),
        );

        if (result.meta.requestStatus === 'fulfilled') {
            dispatch(closeHomeAssetTableFeedback());
        }
    },
);
