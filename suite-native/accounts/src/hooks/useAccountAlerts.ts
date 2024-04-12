import { useAlert } from '@suite-native/alerts';
import { useTranslate } from '@suite-native/intl';

export const useAccountAlerts = () => {
    const { showAlert, hideAlert } = useAlert();
    const { translate } = useTranslate();

    const showCantAddccountDeviceIsViewOnlyErrorAlert = () =>
        showAlert({
            title: translate('moduleAddAccounts.alerts.viewOnly.title'),
            description: translate('moduleAddAccounts.alerts.viewOnly.description'),
            primaryButtonTitle: translate('moduleAddAccounts.alerts.viewOnly.actionPrimary'),
            onPressPrimaryButton: hideAlert,
        });

    return { showCantAddccountDeviceIsViewOnlyErrorAlert };
};
