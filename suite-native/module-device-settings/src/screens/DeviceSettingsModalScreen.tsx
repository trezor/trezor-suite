import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';

import {
    selectDevice,
    selectDeviceModel,
    selectDeviceReleaseInfo,
    selectIsPortfolioTrackerDevice,
} from '@suite-common/wallet-core';
import { Button, Text, VStack } from '@suite-native/atoms';
import { DeviceImage } from '@suite-native/device';
import { Translation, useTranslate } from '@suite-native/intl';
import {
    AppTabsRoutes,
    HomeStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    Screen,
    ScreenSubHeader,
    StackNavigationProps,
} from '@suite-native/navigation';
import { DeviceModelInternal } from '@trezor/connect';

import { DeviceFirmwareCard } from '../components/DeviceFirmwareCard';
import { DevicePinProtectionCard } from '../components/DevicePinProtectionCard';
import { HowToUpdateBottomSheet } from '../components/HowToUpdateBottomSheet';

type NavigationProp = StackNavigationProps<RootStackParamList, RootStackRoutes.DeviceSettingsStack>;

export const DeviceSettingsModalScreen = () => {
    const navigation = useNavigation<NavigationProp>();
    const { translate } = useTranslate();

    const device = useSelector(selectDevice);
    const deviceModel = useSelector(selectDeviceModel);
    const isPortfolioTrackerDevice = useSelector(selectIsPortfolioTrackerDevice);
    const deviceReleaseInfo = useSelector(selectDeviceReleaseInfo);

    const [isUpdateSheetOpen, setIsUpdateSheetOpen] = useState<boolean>(false);

    const isUpgradable = deviceReleaseInfo?.isNewer ?? false;

    useEffect(() => {
        if (isPortfolioTrackerDevice) {
            navigation.navigate(RootStackRoutes.AppTabs, {
                screen: AppTabsRoutes.HomeStack,
                params: {
                    screen: HomeStackRoutes.Home,
                },
            });
        }
    }, [isPortfolioTrackerDevice, navigation]);

    if (!device || !deviceModel) {
        return null;
    }

    const handleUpdateClick = () => setIsUpdateSheetOpen(true);

    return (
        <Screen
            screenHeader={
                <ScreenSubHeader
                    customHorizontalPadding="sp16"
                    content={translate('moduleDeviceSettings.title')}
                    closeActionType="close"
                />
            }
            customHorizontalPadding="sp16"
        >
            <VStack marginVertical="sp32" spacing="sp24" alignItems="center">
                <DeviceImage deviceModel={deviceModel} />
                <Text variant="titleMedium">{device.name}</Text>
            </VStack>
            <VStack spacing="sp24">
                <DeviceFirmwareCard />
                {deviceModel !== DeviceModelInternal.T1B1 && <DevicePinProtectionCard />}
                {isUpgradable && (
                    <Button colorScheme="primary" onPress={handleUpdateClick}>
                        <Translation id="moduleDeviceSettings.updateHowTo.title" />
                    </Button>
                )}
            </VStack>
            <HowToUpdateBottomSheet
                isVisible={isUpdateSheetOpen}
                onClose={setIsUpdateSheetOpen}
                title={<Translation id="moduleDeviceSettings.updateHowTo.title" />}
            />
        </Screen>
    );
};
