import { useDispatch, useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { Button, TrezorSuiteLiteHeader } from '@suite-native/atoms';
import { accountsActions, AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import { AccountKey } from '@suite-common/wallet-types';
import {
    AppTabsRoutes,
    HomeStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    StackNavigationProps,
} from '@suite-native/navigation';
import { useAlert } from '@suite-native/alerts';

type AccountSettingsRemoveCoinButtonProps = {
    accountKey: AccountKey;
};

export const AccountSettingsRemoveCoinButton = ({
    accountKey,
}: AccountSettingsRemoveCoinButtonProps) => {
    const dispatch = useDispatch();
    const { showAlert, hideAlert } = useAlert();
    const account = useSelector((state: AccountsRootState) =>
        selectAccountByKey(state, accountKey),
    );

    const navigation =
        useNavigation<StackNavigationProps<RootStackParamList, RootStackRoutes.AccountSettings>>();

    if (!account) return null;

    const handleRemoveAccount = () => {
        dispatch(accountsActions.removeAccount([account]));

        navigation.navigate(RootStackRoutes.AppTabs, {
            screen: AppTabsRoutes.HomeStack,
            params: {
                screen: HomeStackRoutes.Home,
            },
        });
    };

    const handleShowAlert = () => {
        showAlert({
            icon: 'shieldWarning',
            pictogramVariant: 'red',
            title: (
                <>
                    Do you really want to remove this coin from <TrezorSuiteLiteHeader />?
                </>
            ),
            description:
                'Your coins remain intact and safe. Import this coin again using your public key (XPUB) or receive address at any time.',
            primaryButtonTitle: 'Remove coin',
            primaryButtonVariant: 'dangerElevation0',
            onPressPrimaryButton: handleRemoveAccount,
            secondaryButtonTitle: 'Cancel',
            onPressSecondaryButton: () => hideAlert(),
        });
    };

    return (
        <Button size="large" onPress={handleShowAlert} colorScheme="dangerElevation0">
            Remove coin
        </Button>
    );
};
