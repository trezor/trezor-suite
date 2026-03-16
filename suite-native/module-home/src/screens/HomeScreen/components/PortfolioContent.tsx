import { forwardRef } from 'react';
import { LinearTransition } from 'react-native-reanimated';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import { selectIsDeviceAuthorized, selectIsPortfolioTrackerDevice } from '@suite-common/device';
import { selectHasRunningDiscovery } from '@suite-common/wallet-core';
import { selectHasDeviceAnySendAvailableAccount } from '@suite-native/accounts';
import { Assets } from '@suite-native/assets';
import { AnimatedVStack, Button, HStack, VStack } from '@suite-native/atoms';
import { selectHasFirmwareAuthenticityCheckHardFailedForSelectedDevice } from '@suite-native/device';
import { Translation } from '@suite-native/intl';
import {
    ReceiveStackRoutes,
    type RootStackParamList,
    RootStackRoutes,
    SendStackRoutes,
    type StackNavigationProps,
} from '@suite-native/navigation';

import { HomescreenAlerts } from './HomescreenAlerts';
import { PortfolioGraph, type PortfolioGraphRef } from './PortfolioGraph';
import { ReferralButton } from './ReferralButton';

export const PortfolioContent = forwardRef<PortfolioGraphRef>((_props, ref) => {
    const navigation = useNavigation<StackNavigationProps<RootStackParamList, RootStackRoutes>>();
    const isDeviceAuthorized = useSelector(selectIsDeviceAuthorized);
    const hasDiscovery = useSelector(selectHasRunningDiscovery);
    const hasDeviceAnySendAvailableAccount = useSelector(selectHasDeviceAnySendAvailableAccount);
    const hasFirmwareAuthenticityCheckHardFailed = useSelector(
        selectHasFirmwareAuthenticityCheckHardFailedForSelectedDevice,
    );

    const isPortfolioTracker = useSelector(selectIsPortfolioTrackerDevice);

    const showTransferButtons = isDeviceAuthorized && !hasDiscovery;
    const showReceiveButton = !hasFirmwareAuthenticityCheckHardFailed;
    const showSendButton = hasDeviceAnySendAvailableAccount;

    const handleReceive = () => {
        navigation.navigate(RootStackRoutes.ReceiveStack, {
            screen: ReceiveStackRoutes.ReceiveAccounts,
        });
    };

    const handleSend = () => {
        navigation.navigate(RootStackRoutes.SendStack, {
            screen: SendStackRoutes.SendAccounts,
        });
    };

    return (
        <VStack spacing="sp32" marginTop="sp8">
            <HomescreenAlerts />
            <AnimatedVStack spacing="sp32" layout={LinearTransition}>
                <PortfolioGraph ref={ref} />
                <VStack spacing="sp64" marginHorizontal="sp16">
                    <VStack spacing="sp24">
                        {showTransferButtons && (
                            <HStack spacing="sp16" justifyContent="space-between">
                                {showReceiveButton && (
                                    <Button
                                        flex={1}
                                        testID="@home/portfolio/receive-button"
                                        onPress={handleReceive}
                                        iconLeft="arrowDown"
                                    >
                                        <Translation id="moduleHome.buttons.receive" />
                                    </Button>
                                )}
                                {showSendButton && (
                                    <Button
                                        flex={1}
                                        testID="@home/portfolio/send-button"
                                        onPress={handleSend}
                                        iconLeft="arrowUp"
                                    >
                                        <Translation id="moduleHome.buttons.send" />
                                    </Button>
                                )}
                            </HStack>
                        )}
                        <Assets />
                    </VStack>
                    {!isPortfolioTracker && <ReferralButton />}
                </VStack>
            </AnimatedVStack>
        </VStack>
    );
});
