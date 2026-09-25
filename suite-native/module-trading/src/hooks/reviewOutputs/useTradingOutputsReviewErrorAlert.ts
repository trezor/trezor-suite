import { useCallback } from 'react';

import { useAlert } from '@suite-native/alerts';
import { useTranslate } from '@suite-native/intl';

export const useTradingOutputsReviewErrorAlert = () => {
    const { showAlert } = useAlert();
    const { translate } = useTranslate();

    return useCallback(
        (onRetry: () => void, onCancel: () => void) => {
            showAlert({
                icon: 'warningCircle',
                title: translate('moduleSend.review.outputs.errorAlert.generic.title'),
                description: translate('moduleSend.review.outputs.errorAlert.generic.description'),
                primaryButtonTitle: translate('generic.buttons.tryAgain'),
                primaryButtonColorProps: { intent: 'critical', priority: 'primary' },
                onPressPrimaryButton: onRetry,
                secondaryButtonTitle: translate('generic.buttons.cancel'),
                secondaryButtonColorProps: { intent: 'critical', priority: 'secondary' },
                onPressSecondaryButton: onCancel,
            });
        },
        [showAlert, translate],
    );
};
