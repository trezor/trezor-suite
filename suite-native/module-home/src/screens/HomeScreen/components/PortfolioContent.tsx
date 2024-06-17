import { useSelector } from 'react-redux';
import { forwardRef } from 'react';

import { useNavigation } from '@react-navigation/native';

import { Box, Button, Divider, VStack } from '@suite-native/atoms';
import { Assets } from '@suite-native/assets';
import { FeatureFlag, useFeatureFlag } from '@suite-native/feature-flags';
import {
    AccountsImportStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    SendStackRoutes,
    StackNavigationProps,
} from '@suite-native/navigation';
import { selectIsPortfolioTrackerDevice } from '@suite-common/wallet-core';
import { Translation } from '@suite-native/intl';

import { PortfolioGraph, PortfolioGraphRef } from './PortfolioGraph';

export const PortfolioContent = forwardRef<PortfolioGraphRef>((_props, ref) => {
    const navigation = useNavigation<StackNavigationProps<RootStackParamList, RootStackRoutes>>();

    const isPortfolioTrackerDevice = useSelector(selectIsPortfolioTrackerDevice);

    const [isUsbDeviceConnectFeatureEnabled] = useFeatureFlag(FeatureFlag.IsDeviceConnectEnabled);
    const [isSendEnabled] = useFeatureFlag(FeatureFlag.IsSendEnabled);

    const handleImportAssets = () => {
        navigation.navigate(RootStackRoutes.AccountsImport, {
            screen: AccountsImportStackRoutes.SelectNetwork,
        });
    };

    const handleReceive = () => {
        navigation.navigate(RootStackRoutes.ReceiveModal, { closeActionType: 'back' });
    };

    const handleSend = () => {
        navigation.navigate(RootStackRoutes.SendStack, { screen: SendStackRoutes.SendAccounts });
    };

    return (
        <VStack spacing="large" marginTop="small">
            <PortfolioGraph ref={ref} />
            <VStack spacing="large" marginHorizontal="small">
                <Box>
                    <Assets />
                </Box>
                {isPortfolioTrackerDevice && (
                    <Box>
                        <Button
                            testID="@home/portfolio/sync-coins-button"
                            colorScheme="tertiaryElevation0"
                            size="large"
                            onPress={handleImportAssets}
                        >
                            <Translation id="moduleHome.buttons.syncMyCoins" />
                        </Button>
                    </Box>
                )}
                {!isUsbDeviceConnectFeatureEnabled && (
                    <>
                        <Divider />
                        <Box>
                            <Button
                                data-testID="@home/portolio/recieve-button"
                                size="large"
                                onPress={handleReceive}
                                viewLeft="receive"
                            >
                                <Translation id="moduleHome.buttons.receive" />
                            </Button>
                        </Box>
                    </>
                )}
                {/* TODO: remove this button when there is a proper design of the send flow ready */}
                {isSendEnabled && (
                    <Button size="large" onPress={handleSend}>
                        Send crypto
                    </Button>
                )}
            </VStack>
        </VStack>
    );
});
