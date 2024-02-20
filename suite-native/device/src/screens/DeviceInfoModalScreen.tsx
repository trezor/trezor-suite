import { useSelector } from 'react-redux';
import { useEffect, useState } from 'react';

import { G } from '@mobily/ts-belt';
import { useNavigation } from '@react-navigation/native';

import { DeviceModelInternal } from '@trezor/connect';
import {
    Image,
    Box,
    Card,
    HStack,
    VStack,
    Button,
    IconButton,
    ScreenHeaderWrapper,
    Text,
} from '@suite-native/atoms';
import {
    AppTabsRoutes,
    HomeStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    Screen,
    StackNavigationProps,
} from '@suite-native/navigation';
import {
    selectDevice,
    selectDeviceModel,
    selectDeviceReleaseInfo,
    selectIsPortfolioTrackerDevice,
    selectDeviceLabel,
} from '@suite-common/wallet-core';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { useTranslate } from '@suite-native/intl';
import { getFirmwareVersion } from '@trezor/device-utils';
import { useOpenLink } from '@suite-native/link';

import { HowToUpdateBottomSheet } from '../components/HowToUpdateBottomSheet';

const deviceImageMap = {
    [DeviceModelInternal.T1B1]: require('../assets/t1.png'),
    [DeviceModelInternal.T2T1]: require('../assets/tt.png'),
    [DeviceModelInternal.T2B1]: require('../assets/ts3.png'),
} as const satisfies Record<DeviceModelInternal, string>;

const deviceModelNameMap = {
    [DeviceModelInternal.T1B1]: 'Trezor Model One',
    [DeviceModelInternal.T2T1]: 'Trezor Model T',
    [DeviceModelInternal.T2B1]: 'Trezor Safe 3',
} as const satisfies Record<DeviceModelInternal, string>;

const emptyBoxStyle = prepareNativeStyle(() => ({
    width: 48,
}));

const contentStyle = prepareNativeStyle(() => ({
    flexGrow: 1,
}));

type NavigationProp = StackNavigationProps<RootStackParamList, RootStackRoutes.DeviceInfo>;

export const DeviceInfoModalScreen = () => {
    const navigation = useNavigation<NavigationProp>();
    const { translate } = useTranslate();
    const openLink = useOpenLink();

    const deviceModel = useSelector(selectDeviceModel);
    const deviceLabel = useSelector(selectDeviceLabel);
    const device = useSelector(selectDevice);
    const isPortfolioTrackerDevice = useSelector(selectIsPortfolioTrackerDevice);
    const deviceReleaseInfo = useSelector(selectDeviceReleaseInfo);
    const { applyStyle } = useNativeStyles();

    const [isUpdateSheetOpen, setIsUpdateSheetOpen] = useState<boolean>(false);

    const isUpgradable = deviceReleaseInfo?.isNewer ?? false;

    const getCardAlertProps = () => {
        if (G.isNotNullable(deviceReleaseInfo)) {
            if (isUpgradable) {
                return {
                    alertTitle: translate('deviceInfo.outdatedFw'),
                    alertVariant: 'warning',
                } as const;
            }

            return {
                alertTitle: translate('deviceInfo.upToDateFw'),
                alertVariant: 'success',
            } as const;
        }

        return { alertTitle: undefined, alertVariant: undefined } as const;
    };
    const cardAlertProps = getCardAlertProps();

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

    if (!deviceModel) return null;

    const currentFwVersion = getFirmwareVersion(device);

    const handleGoBack = () => {
        navigation.goBack();
    };

    const handleAccessoriesClick = () => {
        openLink('https://trezor.io/accessories');
    };

    const handleUpdateClick = () => setIsUpdateSheetOpen(true);

    return (
        <Screen
            screenHeader={
                // TODO once https://github.com/trezor/trezor-suite/issues/9856 is done, this should be removed
                <ScreenHeaderWrapper>
                    <IconButton
                        iconName="close"
                        colorScheme="tertiaryElevation0"
                        onPress={handleGoBack}
                    />
                    <Text>Device info</Text>
                    <Box style={applyStyle(emptyBoxStyle)} />
                </ScreenHeaderWrapper>
            }
        >
            <Box style={applyStyle(contentStyle)}>
                <Card {...cardAlertProps}>
                    <HStack spacing="large">
                        <Image width={92} height={151} source={deviceImageMap[deviceModel]} />
                        <VStack spacing="extraSmall" justifyContent="center">
                            <Text variant="titleSmall">{deviceLabel}</Text>
                            <Text variant="label" color="textSubdued">
                                {deviceModelNameMap[deviceModel]}
                            </Text>
                            <Text variant="hint">
                                {translate('deviceInfo.installedFw', {
                                    version: currentFwVersion,
                                })}
                            </Text>
                        </VStack>
                    </HStack>
                </Card>
            </Box>
            <VStack spacing="medium">
                <Button
                    colorScheme="tertiaryElevation0"
                    onPress={handleAccessoriesClick}
                    iconRight="arrowUpRight"
                >
                    {translate('deviceInfo.goToAccessories')}
                </Button>
                {isUpgradable && (
                    <Button colorScheme="primary" onPress={handleUpdateClick}>
                        {translate('deviceInfo.updateHowTo.title')}
                    </Button>
                )}
            </VStack>
            <HowToUpdateBottomSheet
                isVisible={isUpdateSheetOpen}
                onClose={setIsUpdateSheetOpen}
                title={translate('deviceInfo.updateHowTo.title')}
            />
        </Screen>
    );
};
