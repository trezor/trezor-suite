import { useCallback } from 'react';

import { exhaustive } from '@trezor/type-utils';

import { type EarnReviewErrorPayload, getEarnReviewErrorReaction } from '../utils';
import { useShowDeviceDisconnectedDuringEarnReviewAlert } from './useShowDeviceDisconnectedDuringEarnReviewAlert';
import {
    type ReviewFormType,
    useShowPushTransactionFailedDuringReviewAlert,
} from './useShowPushTransactionFailedDuringReviewAlert';

export const useHandleEarnReviewError = (
    formType: ReviewFormType,
    navigation: { pop: () => void },
) => {
    const showDeviceDisconnectedAlert = useShowDeviceDisconnectedDuringEarnReviewAlert();
    const { showReviewAlert } = useShowPushTransactionFailedDuringReviewAlert(formType);

    return useCallback(
        (payload: EarnReviewErrorPayload) => {
            const reaction = getEarnReviewErrorReaction(payload);

            switch (reaction) {
                case 'none':
                    return;
                case 'popScreen':
                    navigation.pop();

                    return;
                case 'pendingConflict':
                case 'pushFailed':
                case 'signFailed':
                    showReviewAlert(reaction);

                    return;
                case 'deviceDisconnected':
                    showDeviceDisconnectedAlert();

                    return;
                default:
                    exhaustive(reaction);
            }
        },
        [navigation, showDeviceDisconnectedAlert, showReviewAlert],
    );
};
