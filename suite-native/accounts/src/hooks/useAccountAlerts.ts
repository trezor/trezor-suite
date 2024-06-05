import { useAlert } from '@suite-native/alerts';
import { useTranslate } from '@suite-native/intl';

export const useAccountAlerts = () => {
    const { showAlert, hideAlert } = useAlert();
    const { translate } = useTranslate();

    const showViewOnlyAddAccountAlert = () =>
        showAlert({
            title: translate('moduleAccounts.viewOnlyAddAccountAlert.title'),
            description: translate('moduleAccounts.viewOnlyAddAccountAlert.description'),
            primaryButtonTitle: translate('moduleAccounts.viewOnlyAddAccountAlert.actionPrimary'),
            onPressPrimaryButton: hideAlert,
        });

    return { showViewOnlyAddAccountAlert };
};
