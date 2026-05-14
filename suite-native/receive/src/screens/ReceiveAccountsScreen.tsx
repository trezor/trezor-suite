import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { AccountsList, AddAccountButton, type OnSelectAccount } from '@suite-native/accounts';
import { events } from '@suite-native/analytics';
import { selectHasFirmwareAuthenticityCheckHardFailedForSelectedDevice } from '@suite-native/device';
import { Translation } from '@suite-native/intl';
import {
    type ReceiveStackParamList,
    ReceiveStackRoutes,
    Screen,
    ScreenHeader,
    type StackNavigationProps,
} from '@suite-native/navigation';
import { useAnalytics } from '@suite-native/services';

import { ReceiveBlockedDeviceCompromisedScreen } from './ReceiveBlockedDeviceCompromisedScreen';

type NavigationProp = StackNavigationProps<
    ReceiveStackParamList,
    ReceiveStackRoutes.ReceiveAccounts
>;

export const ReceiveAccountsScreen = () => {
    const analytics = useAnalytics();
    const navigation = useNavigation<NavigationProp>();
    const hasFirmwareAuthenticityCheckHardFailed = useSelector(
        selectHasFirmwareAuthenticityCheckHardFailedForSelectedDevice,
    );
    if (hasFirmwareAuthenticityCheckHardFailed) return <ReceiveBlockedDeviceCompromisedScreen />;

    const navigateToReceiveScreen: OnSelectAccount = ({ account, tokenAddress, tokenSymbol }) => {
        analytics.report({
            type: events.receiveFlowEnteredEvent.name,
            payload: {
                location: 'dashboard',
                assetSymbol: account.symbol,
                tokenContract: tokenAddress,
                tokenSymbol,
            },
        });

        navigation.navigate(ReceiveStackRoutes.ReceiveAccount, {
            accountKey: account.key,
            tokenContract: tokenAddress,
            closeActionType: 'back',
        });
    };

    return (
        <Screen
            header={
                <ScreenHeader
                    title={<Translation id="moduleReceive.receiveTitle" />}
                    rightIcon={<AddAccountButton flowType="receive" />}
                    closeActionType="close"
                />
            }
        >
            <AccountsList onSelectAccount={navigateToReceiveScreen} hideTokensIntoModal />
        </Screen>
    );
};
