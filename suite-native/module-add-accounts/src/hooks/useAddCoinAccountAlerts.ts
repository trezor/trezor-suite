import { useAlert } from '@suite-native/alerts';
import { useTranslate } from '@suite-native/intl';
import { useOpenLink } from '@suite-native/link';
import { TREZOR_SUPPORT_MULTIPLE_ACCOUNTS } from '@trezor/urls';

export const useAddCoinAccountAlerts = () => {
    const { translate } = useTranslate();
    const openLink = useOpenLink();
    const { showAlert, hideAlert } = useAlert();

    const showTooManyAccountsAlert = () =>
        showAlert({
            title: translate('moduleAddAccounts.alerts.tooManyAccounts.title'),
            description: translate('moduleAddAccounts.alerts.tooManyAccounts.description'),
            pictogramVariant: 'critical',
            primaryButtonTitle: translate('moduleAddAccounts.alerts.tooManyAccounts.actionPrimary'),
            onPressPrimaryButton: hideAlert,
        });

    const showAnotherEmptyAccountAlert = () =>
        showAlert({
            title: translate('moduleAddAccounts.alerts.anotherEmptyAccount.title'),
            description: translate('moduleAddAccounts.alerts.anotherEmptyAccount.description'),
            pictogramVariant: 'critical',
            primaryButtonTitle: translate(
                'moduleAddAccounts.alerts.anotherEmptyAccount.actionPrimary',
            ),
            onPressPrimaryButton: hideAlert,
            secondaryButtonTitle: translate(
                'moduleAddAccounts.alerts.anotherEmptyAccount.actionSecondary',
            ),
            onPressSecondaryButton: () => {
                openLink(TREZOR_SUPPORT_MULTIPLE_ACCOUNTS);
                hideAlert();
            },
        });

    const showGeneralErrorAlert = () =>
        showAlert({
            title: translate('moduleAddAccounts.alerts.generalError.title'),
            description: translate('moduleAddAccounts.alerts.generalError.description'),
            pictogramVariant: 'critical',
            primaryButtonTitle: translate('moduleAddAccounts.alerts.generalError.actionPrimary'),
            onPressPrimaryButton: hideAlert,
        });
    const showPassphraseAuthAlert = () =>
        showAlert({
            title: translate('modulePassphrase.featureAuthorizationError'),
            pictogramVariant: 'critical',
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
