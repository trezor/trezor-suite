import { useCallback } from 'react';

import { useAlert } from '@suite-native/alerts';
import { Translation } from '@suite-native/intl';

type CancellationAlertResult = {
    wasReviewCanceled: boolean;
};

export const useShowYieldReviewCancellationAlert = () => {
    const { showAlert } = useAlert();

    return useCallback(
        () =>
            new Promise<CancellationAlertResult>(resolve =>
                showAlert({
                    title: <Translation id="transactionManagement.review.cancelAlert.title" />,
                    primaryButtonTitle: <Translation id="generic.buttons.cancel" />,
                    primaryButtonColorProps: { intent: 'critical', priority: 'primary' },
                    secondaryButtonColorProps: { intent: 'critical', priority: 'secondary' },
                    secondaryButtonTitle: (
                        <Translation id="transactionManagement.review.cancelAlert.continueButton" />
                    ),
                    onPressPrimaryButton: () => resolve({ wasReviewCanceled: true }),
                    onPressSecondaryButton: () => resolve({ wasReviewCanceled: false }),
                }),
            ),
        [showAlert],
    );
};
