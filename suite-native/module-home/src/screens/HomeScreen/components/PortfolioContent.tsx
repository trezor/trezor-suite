import { forwardRef } from 'react';
import { LinearTransition } from 'react-native-reanimated';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import {
    selectHasRunningDiscovery,
    selectIsDeviceAuthorized,
    selectIsPortfolioTrackerDevice,
} from '@suite-common/wallet-core';
import { selectHasDeviceAnySendAvailableAccount } from '@suite-native/accounts';
import { Assets } from '@suite-native/assets';
import { AnimatedVStack, Button, HStack, VStack } from '@suite-native/atoms';
import { selectHasFirmwareAuthenticityCheckHardFailed } from '@suite-native/device';
import { Translation } from '@suite-native/intl';
import {
    ReceiveStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    SendStackRoutes,
    StackNavigationProps,
} from '@suite-native/navigation';

import { FirmwareUpdateAlert } from './FirmwareUpdateAlert';
import { PortfolioGraph, PortfolioGraphRef } from './PortfolioGraph';
import { ReferralButton } from './ReferralButton';
import { SuiteSyncKeysAlert } from './SuiteSyncKeysAlert';
import {
    selectShouldDisplaySuiteSyncAlert,
    selectShouldDisplayUpgradeFirmwareAlert,
} from '../homescreenSelectors';

export const PortfolioContent = forwardRef<PortfolioGraphRef>((_props, ref) => {
    const navigation = useNavigation<StackNavigationProps<RootStackParamList, RootStackRoutes>>();
    const isDeviceAuthorized = useSelector(selectIsDeviceAuthorized);
    const hasDiscovery = useSelector(selectHasRunningDiscovery);
    const hasDeviceAnySendAvailableAccount = useSelector(selectHasDeviceAnySendAvailableAccount);
    const hasFirmwareAuthenticityCheckHardFailed = useSelector(
        selectHasFirmwareAuthenticityCheckHardFailed,
    );

    const shouldDisplaySuiteSyncAlert = useSelector(selectShouldDisplaySuiteSyncAlert);
    const shouldDisplayFirmwareUpdateAlert = useSelector(selectShouldDisplayUpgradeFirmwareAlert);

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

    const getHomescreenAlert = () => {
        if (shouldDisplaySuiteSyncAlert) {
            return <SuiteSyncKeysAlert />;
        } else if (shouldDisplayFirmwareUpdateAlert) {
            return <FirmwareUpdateAlert />;
        } else {
            return null;
        }
    };

    return (
        <VStack spacing="sp32" marginTop="sp8">
            {getHomescreenAlert()}
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
                                        viewLeft="arrowDown"
                                    >
                                        <Translation id="moduleHome.buttons.receive" />
                                    </Button>
                                )}
                                {showSendButton && (
                                    <Button
                                        flex={1}
                                        testID="@home/portfolio/send-button"
                                        onPress={handleSend}
                                        viewLeft="arrowUp"
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
