import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { AccountsList, AddAccountButton, OnSelectAccount } from '@suite-native/accounts';
import { EventType } from '@suite-native/analytics';
import { selectHasFirmwareAuthenticityCheckHardFailed } from '@suite-native/device';
import { Translation } from '@suite-native/intl';
import {
    ReceiveStackParamList,
    ReceiveStackRoutes,
    Screen,
    ScreenHeader,
    StackNavigationProps,
} from '@suite-native/navigation';
import { useLegacyAnalytics } from '@suite-native/services';

import { ReceiveBlockedDeviceCompromisedScreen } from './ReceiveBlockedDeviceCompromisedScreen';

type NavigationProp = StackNavigationProps<
    ReceiveStackParamList,
    ReceiveStackRoutes.ReceiveAccounts
>;

export const ReceiveAccountsScreen = () => {
    const legacyAnalytics = useLegacyAnalytics();
    const navigation = useNavigation<NavigationProp>();
    const hasFirmwareAuthenticityCheckHardFailed = useSelector(
        selectHasFirmwareAuthenticityCheckHardFailed,
    );
    if (hasFirmwareAuthenticityCheckHardFailed) return <ReceiveBlockedDeviceCompromisedScreen />;

    const navigateToReceiveScreen: OnSelectAccount = ({ account, tokenAddress, tokenSymbol }) => {
        legacyAnalytics.report({
            type: EventType.ReceiveFlowEntered,
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
