import { useCallback } from 'react';

import { type TradingError } from '@suite-common/trading';
import { useAlert } from '@suite-native/alerts';
import { useTranslate } from '@suite-native/intl';

import { getTradingErrorAlertDescriptionId } from '../../utils/general/tradingErrorAlertUtils';

export const useTradingOutputsReviewErrorAlert = () => {
    const { showAlert } = useAlert();
    const { translate } = useTranslate();

    return useCallback(
        (tradingError: TradingError, onRetry: () => void, onCancel: () => void) => {
            showAlert({
                icon: 'warningCircle',
                title: translate('moduleTrading.tradingReviewOutputs.errorAlert.title'),
                description: translate(getTradingErrorAlertDescriptionId(tradingError.code)),
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
