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
    useNavigateToInitialScreen,
} from '@suite-native/navigation';

import { ReceiveBlockedDeviceCompromisedScreen } from './ReceiveBlockedDeviceCompromisedScreen';

type NavigationProp = StackNavigationProps<
    ReceiveStackParamList,
    ReceiveStackRoutes.ReceiveAccounts
>;

export const ReceiveAccountsScreen = () => {
    const navigateToInitialScreen = useNavigateToInitialScreen();
    const { analytics } = useServices(selectNativeAnalyticsDep);
    const navigation = useNavigation<NavigationProp>();
    const hasFirmwareAuthenticityCheckHardFailed = useSelector(
        selectHasFirmwareAuthenticityCheckHardFailedForSelectedDevice,
    );

    if (hasFirmwareAuthenticityCheckHardFailed) return <ReceiveBlockedDeviceCompromisedScreen />;

    const navigateToReceiveScreen: OnSelectAccount = ({ account, tokenAddress }) => {
        analytics.report({
            type: events.receiveOptionsScreenEvent.name,
            payload: { option: 'account' },
        });

        navigation.navigate(ReceiveStackRoutes.ReceiveAddress, {
            accountKey: account.key,
            tokenContract: tokenAddress,
            closeActionType: 'back',
        });
    };

    const handleClose = () => {
        analytics.report({
            type: events.receiveOptionsScreenEvent.name,
            payload: { option: 'close' },
        });
        navigateToInitialScreen();
    };

    const handleAddAccount = () => {
        analytics.report({
            type: events.receiveOptionsScreenEvent.name,
            payload: { option: 'addAccount' },
        });
    };

    return (
        <Screen>
            <AccountsListWithFilter
                title={<Translation id="moduleReceive.receiveTitle" />}
                onSelectAccount={navigateToReceiveScreen}
                flowType="receive"
                closeActionType="close"
                closeAction={handleClose}
                onAddAccount={handleAddAccount}
            />
        </Screen>
    );
};
