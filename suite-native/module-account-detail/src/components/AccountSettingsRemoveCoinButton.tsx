import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { injectDispatch } from '@suite-common/redux-utils';
import {
    type AccountsRootState,
    accountsActions,
    selectAccountByKey,
} from '@suite-common/wallet-core';
import { type AccountKey } from '@suite-common/wallet-types';
import { useAlert } from '@suite-native/alerts';
import { Button, TrezorSuiteHeader } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    type AccountDetailStackParamList,
    type AccountDetailStackRoutes,
    AccountsStackRoutes,
    AppTabsRoutes,
    type RootStackParamList,
    RootStackRoutes,
    type StackToStackCompositeNavigationProps,
} from '@suite-native/navigation';
import { useServices } from '@trezor/dependency-injection';

type AccountSettingsRemoveCoinButtonProps = {
    accountKey: AccountKey;
};

type NavigationProps = StackToStackCompositeNavigationProps<
    AccountDetailStackParamList,
    AccountDetailStackRoutes.AccountSettings,
    RootStackParamList
>;

export const AccountSettingsRemoveCoinButton = ({
    accountKey,
}: AccountSettingsRemoveCoinButtonProps) => {
    const { dispatch } = useServices(injectDispatch);
    const navigation = useNavigation<NavigationProps>();
    const { showAlert, hideAlert } = useAlert();

    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );

    if (!account) return null;

    const handleRemoveAccount = () => {
        dispatch(accountsActions.removeAccount([account]));
        navigation.popTo(RootStackRoutes.AppTabs, {
            screen: AppTabsRoutes.AccountsStack,
            params: {
                screen: AccountsStackRoutes.Accounts,
            },
        });
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
