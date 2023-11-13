import { useSelector } from 'react-redux';
import { useEffect } from 'react';

import { CommonActions, useNavigation } from '@react-navigation/native';

import { DeviceModelInternal } from '@trezor/connect';
import {
    Image,
    Box,
    Card,
    HStack,
    IconButton,
    ScreenHeaderWrapper,
    Text,
} from '@suite-native/atoms';
import { HomeStackRoutes, RootStackRoutes, Screen } from '@suite-native/navigation';
import {
    selectDeviceFirmwareVersion,
    selectDeviceModel,
    selectIsSelectedDeviceImported,
    selectSelectedDeviceName,
} from '@suite-common/wallet-core';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import { useTranslate } from '@suite-native/intl';

const deviceImage = {
    [DeviceModelInternal.T1B1]: require('../assets/t1.png'),
    [DeviceModelInternal.T2T1]: require('../assets/tt.png'),
    [DeviceModelInternal.T2B1]: require('../assets/ts3.png'),
} as const satisfies Record<DeviceModelInternal, string>;

const emptyBoxStyle = prepareNativeStyle(() => ({
    width: 48,
}));

export const DeviceInfoModalScreen = () => {
    const navigation = useNavigation();

    const { translate } = useTranslate();

    const deviceModel = useSelector(selectDeviceModel);
    const deviceName = useSelector(selectSelectedDeviceName);
    const deviceFirmwareVersion = useSelector(selectDeviceFirmwareVersion);
    const isPortfolioTrackerDevice = useSelector(selectIsSelectedDeviceImported);

    const { applyStyle } = useNativeStyles();

    useEffect(() => {
        if (isPortfolioTrackerDevice) {
            //  Should be part of useDeviceConnect hook
            //  once https://github.com/trezor/trezor-suite/issues/9747 is finished
            navigation.dispatch(
                CommonActions.reset({
                    index: 0,
                    routes: [
                        {
                            name: RootStackRoutes.AppTabs,
                            params: {
                                screen: HomeStackRoutes.Home,
                            },
                        },
                    ],
                }),
            );
        }
    }, [isPortfolioTrackerDevice, navigation]);

    if (!deviceModel) return null;

    const handleGoBack = () => {
        navigation.goBack();
    };

    const stringifiedFirmwareVersion = deviceFirmwareVersion?.join('.');

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
            <Card>
                <HStack spacing="large">
                    <Image width={92} height={151} source={deviceImage[deviceModel]} />
                    <Box justifyContent="center">
                        <Text variant="titleSmall">{deviceName}</Text>
                        <Text variant="hint">
                            {translate('deviceInfo.installedFw', { stringifiedFirmwareVersion })}
                        </Text>
                    </Box>
                </HStack>
            </Card>
        </Screen>
    );
};
