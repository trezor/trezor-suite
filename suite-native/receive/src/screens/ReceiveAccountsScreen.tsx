import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { AccountsList, AddAccountButton, OnSelectAccount } from '@suite-native/accounts';
import { selectHasFirmwareAuthenticityCheckHardFailed } from '@suite-native/device';
import { useTranslate } from '@suite-native/intl';
import {
    ReceiveStackParamList,
    ReceiveStackRoutes,
    Screen,
    ScreenHeader,
    StackNavigationProps,
} from '@suite-native/navigation';

import { ReceiveBlockedDeviceCompromisedScreen } from './ReceiveBlockedDeviceCompromisedScreen';

type NavigationProp = StackNavigationProps<
    ReceiveStackParamList,
    ReceiveStackRoutes.ReceiveAccounts
>;

export const ReceiveAccountsScreen = () => {
    const { translate } = useTranslate();
    const navigation = useNavigation<NavigationProp>();
    const hasFirmwareAuthenticityCheckHardFailed = useSelector(
        selectHasFirmwareAuthenticityCheckHardFailed,
    );
    if (hasFirmwareAuthenticityCheckHardFailed) return <ReceiveBlockedDeviceCompromisedScreen />;

    const navigateToReceiveScreen: OnSelectAccount = ({ account, tokenAddress }) =>
        navigation.navigate(ReceiveStackRoutes.ReceiveAccount, {
            accountKey: account.key,
            tokenContract: tokenAddress,
            closeActionType: 'back',
        });

    return (
        <Screen
            header={
                <ScreenHeader
                    content={translate('moduleReceive.receiveTitle')}
                    rightIcon={<AddAccountButton flowType="receive" />}
                    closeActionType="close"
                />
            }
        >
            <AccountsList onSelectAccount={navigateToReceiveScreen} hideTokensIntoModal />
        </Screen>
    );
};
