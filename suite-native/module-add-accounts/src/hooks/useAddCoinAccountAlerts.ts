import { useOpenLink } from '@suite-native/link';
import { useAlert } from '@suite-native/alerts';
import { useTranslate } from '@suite-native/intl';

export const useAddCoinAccountAlerts = () => {
    const { translate } = useTranslate();
    const openLink = useOpenLink();
    const { showAlert, hideAlert } = useAlert();

    const showTooManyAccountsAlert = () =>
        showAlert({
            title: translate('moduleAddAccounts.alerts.tooManyAccounts.title'),
            description: translate('moduleAddAccounts.alerts.tooManyAccounts.description'),
            icon: 'warning',
            pictogramVariant: 'red',
            primaryButtonTitle: translate('moduleAddAccounts.alerts.tooManyAccounts.actionPrimary'),
            onPressPrimaryButton: hideAlert,
        });

    const showAnotherEmptyAccountAlert = () =>
        showAlert({
            title: translate('moduleAddAccounts.alerts.anotherEmptyAccount.title'),
            description: translate('moduleAddAccounts.alerts.anotherEmptyAccount.description'),
            icon: 'warning',
            pictogramVariant: 'red',
            primaryButtonTitle: translate(
                'moduleAddAccounts.alerts.anotherEmptyAccount.actionPrimary',
            ),
            onPressPrimaryButton: hideAlert,
            secondaryButtonTitle: translate(
                'moduleAddAccounts.alerts.anotherEmptyAccount.actionSecondary',
            ),
            onPressSecondaryButton: () => {
                openLink(
                    translate('moduleAddAccounts.alerts.anotherEmptyAccount.actionSecondaryUrl'),
                );
                hideAlert();
            },
        });

    const showGeneralErrorAlert = () =>
        showAlert({
            title: translate('moduleAddAccounts.alerts.generalError.title'),
            description: translate('moduleAddAccounts.alerts.generalError.description'),
            icon: 'warning',
            pictogramVariant: 'red',
            primaryButtonTitle: translate('moduleAddAccounts.alerts.generalError.actionPrimary'),
            onPressPrimaryButton: hideAlert,
        });
    const showPassphraseAuthAlert = () =>
        showAlert({
            title: translate('modulePassphrase.featureAuthorizationError'),
            pictogramVariant: 'red',
            primaryButtonTitle: translate('generic.buttons.close'),
            primaryButtonVariant: 'redBold',
        });

    return {
        showTooManyAccountsAlert,
        showAnotherEmptyAccountAlert,
        showGeneralErrorAlert,
        showPassphraseAuthAlert,
    };
};
