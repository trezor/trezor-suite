import { useDispatch, useSelector } from 'react-redux';

import {
    type AccountsRootState,
    accountsActions,
    selectAccountByKey,
} from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { useAlert } from '@suite-native/alerts';
import { Button, TrezorSuiteHeader } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { useNavigateToInitialScreen } from '@suite-native/navigation';

type AccountSettingsRemoveCoinButtonProps = {
    accountKey: AccountKey;
};

export const AccountSettingsRemoveCoinButton = ({
    accountKey,
}: AccountSettingsRemoveCoinButtonProps) => {
    const dispatch = useDispatch();
    const navigateToInitialScreen = useNavigateToInitialScreen();
    const { showAlert, hideAlert } = useAlert();

    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );

    if (!account) return null;

    const handleRemoveAccount = () => {
        dispatch(accountsActions.removeAccount([account]));
        navigateToInitialScreen();
    };

    const handleShowAlert = () => {
        showAlert({
            pictogramVariant: 'critical',
            title: (
                <Translation
                    id="moduleAccountManagement.accountSettingsScreen.removeAccountAlert.title"
                    values={{ trezorSuiteHeader: <TrezorSuiteHeader /> }}
                />
            ),
            description: (
                <Translation id="moduleAccountManagement.accountSettingsScreen.removeAccountAlert.description" />
            ),
            primaryButtonTitle: (
                <Translation id="moduleAccountManagement.accountSettingsScreen.removeAccountAlert.primaryButton" />
            ),
            primaryButtonColorProps: { intent: 'critical', priority: 'primary' },
            onPressPrimaryButton: handleRemoveAccount,
            secondaryButtonTitle: <Translation id="generic.buttons.cancel" />,
            secondaryButtonColorProps: { intent: 'critical', priority: 'secondary' },
            onPressSecondaryButton: hideAlert,
        });
    };

    return (
        <Button
            onPress={handleShowAlert}
            intent="critical"
            priority="secondary"
            testID="@account-detail/settings/remove-coin-button"
        >
            <Translation id="moduleAccountManagement.accountSettingsScreen.removeAccountAlert.primaryButton" />
        </Button>
    );
};
