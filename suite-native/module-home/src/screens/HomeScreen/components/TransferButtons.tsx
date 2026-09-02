import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { useServices } from '@suite-common/dependency-injection';
import { selectIsDeviceAuthorized } from '@suite-common/device';
import { selectHasRunningDiscovery } from '@suite-common/wallet-core';
import { selectHasDeviceAnySendAvailableAccount } from '@suite-native/accounts';
import { events, selectNativeAnalyticsDep } from '@suite-native/analytics';
import { Button, HStack } from '@suite-native/atoms';
import { selectHasFirmwareAuthenticityCheckHardFailedForSelectedDevice } from '@suite-native/device';
import { Translation } from '@suite-native/intl';
import {
    ReceiveStackRoutes,
    type RootStackParamList,
    RootStackRoutes,
    SendStackRoutes,
    type StackNavigationProps,
} from '@suite-native/navigation';

const ReceiveButton = () => {
    const { analytics } = useServices(selectNativeAnalyticsDep);
    const navigation = useNavigation<StackNavigationProps<RootStackParamList, RootStackRoutes>>();
    const hasFirmwareAuthenticityCheckHardFailed = useSelector(
        selectHasFirmwareAuthenticityCheckHardFailedForSelectedDevice,
    );

    const showReceiveButton = !hasFirmwareAuthenticityCheckHardFailed;

    const handleReceive = () => {
        analytics.report({
            type: events.receiveFlowEnteredEvent.name,
            payload: { location: 'dashboard' },
        });
        navigation.navigate(RootStackRoutes.ReceiveStack, {
            screen: ReceiveStackRoutes.ReceiveAccounts,
        });
    };

    if (!showReceiveButton) return null;

    return (
        <Button
            flex={1}
            testID="@home/portfolio/receive-button"
            onPress={handleReceive}
            iconLeft="arrowDown"
        >
            <Translation id="moduleHome.buttons.receive" />
        </Button>
    );
};

export const SendButton = () => {
    const { analytics } = useServices(selectNativeAnalyticsDep);
    const navigation = useNavigation<StackNavigationProps<RootStackParamList, RootStackRoutes>>();
    const hasDeviceAnySendAvailableAccount = useSelector(selectHasDeviceAnySendAvailableAccount);
    const showSendButton = hasDeviceAnySendAvailableAccount;

    const handleSend = () => {
        analytics.report({
            type: events.sendFlowEnteredEvent.name,
            payload: { location: 'dashboard' },
        });
        navigation.navigate(RootStackRoutes.SendStack, {
            screen: SendStackRoutes.SendAccounts,
        });
    };

    if (!showSendButton) return null;

    return (
        <Button
            flex={1}
            testID="@home/portfolio/send-button"
            onPress={handleSend}
            iconLeft="arrowUp"
        >
            <Translation id="moduleHome.buttons.send" />
        </Button>
    );
};

export const TransferButtons = () => {
    const isDeviceAuthorized = useSelector(selectIsDeviceAuthorized);
    const hasDiscovery = useSelector(selectHasRunningDiscovery);

    const showTransferButtons = isDeviceAuthorized && !hasDiscovery;

    if (!showTransferButtons) return null;

    return (
        <HStack spacing="sp16" justifyContent="space-between">
            <ReceiveButton />
            <SendButton />
        </HStack>
    );
};
