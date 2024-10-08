import { useSelector } from 'react-redux';
import { useEffect, useState } from 'react';

import { useNavigation } from '@react-navigation/native';

import { DeviceModelInternal } from '@trezor/connect';
import { Image, VStack, Button, Text } from '@suite-native/atoms';
import {
    AppTabsRoutes,
    HomeStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    Screen,
    ScreenSubHeader,
    StackNavigationProps,
} from '@suite-native/navigation';
import {
    selectDevice,
    selectDeviceModel,
    selectDeviceReleaseInfo,
    selectIsPortfolioTrackerDevice,
} from '@suite-common/wallet-core';
import { Translation, useTranslate } from '@suite-native/intl';

import { DeviceFirmwareCard } from '../components/DeviceFirmwareCard';
import { HowToUpdateBottomSheet } from '../components/HowToUpdateBottomSheet';

const deviceImageMap: Record<DeviceModelInternal, string> = {
    [DeviceModelInternal.T1B1]: require('../assets/t1b1.png'),
    [DeviceModelInternal.T2T1]: require('../assets/t2t1.png'),
    [DeviceModelInternal.T2B1]: require('../assets/t3b1.png'),
    [DeviceModelInternal.T3B1]: require('../assets/t3b1.png'),
    [DeviceModelInternal.T3T1]: require('../assets/t3t1.png'),
};

type NavigationProp = StackNavigationProps<RootStackParamList, RootStackRoutes.DeviceInfo>;

export const DeviceInfoModalScreen = () => {
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
                    content={translate('deviceSettings.title')}
                    closeActionType="close"
                />
            }
            customHorizontalPadding="sp16"
        >
            <VStack marginVertical="sp32" spacing="sp24" alignItems="center">
                <Image width={92} height={151} source={deviceImageMap[deviceModel]} />
                <Text variant="titleMedium">{device.name}</Text>
            </VStack>
            <VStack spacing="sp24">
                <DeviceFirmwareCard />
                {isUpgradable && (
                    <Button colorScheme="primary" onPress={handleUpdateClick}>
                        <Translation id="deviceInfo.updateHowTo.title" />
                    </Button>
                )}
            </VStack>
            <HowToUpdateBottomSheet
                isVisible={isUpdateSheetOpen}
                onClose={setIsUpdateSheetOpen}
                title={<Translation id="deviceInfo.updateHowTo.title" />}
            />
        </Screen>
    );
};
