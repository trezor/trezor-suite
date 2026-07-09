import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { useServices } from '@suite-common/dependency-injection';
import { AccountsListWithFilter, type OnSelectAccount } from '@suite-native/accounts';
import { events, selectNativeAnalyticsDep } from '@suite-native/analytics';
import { selectHasFirmwareAuthenticityCheckHardFailedForSelectedDevice } from '@suite-native/device';
import { Translation } from '@suite-native/intl';
import {
    type ReceiveStackParamList,
    ReceiveStackRoutes,
    Screen,
    type StackNavigationProps,
} from '@suite-native/navigation';

import { ReceiveBlockedDeviceCompromisedScreen } from './ReceiveBlockedDeviceCompromisedScreen';

type NavigationProp = StackNavigationProps<
    ReceiveStackParamList,
    ReceiveStackRoutes.ReceiveAccounts
>;

export const ReceiveAccountsScreen = () => {
    const { analytics } = useServices(selectNativeAnalyticsDep);
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
        <Screen>
            <AccountsListWithFilter
                title={<Translation id="moduleReceive.receiveTitle" />}
                onSelectAccount={navigateToReceiveScreen}
                flowType="receive"
                closeActionType="close"
            />
        </Screen>
    );
};
