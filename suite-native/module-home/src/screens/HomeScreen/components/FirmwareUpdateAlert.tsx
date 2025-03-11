import { useMemo } from 'react';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSelector } from 'react-redux';

import { useNavigation } from '@react-navigation/native';
import { atom, useAtomValue, useSetAtom } from 'jotai';

import {
    DeviceRootState,
    DiscoveryRootState,
    selectDeviceId,
    selectDeviceReleaseInfo,
    selectDeviceState,
    selectDeviceUpdateFirmwareVersion,
    selectIsDeviceBackedUp,
    selectIsDeviceConnected,
    selectIsDiscoveryActiveByDeviceState,
    selectIsPortfolioTrackerDevice,
} from '@suite-common/wallet-core';
import { Box, Button, HStack, Text, VStack } from '@suite-native/atoms';
import { useIsFirmwareUpdateFeatureEnabled } from '@suite-native/firmware';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import {
    DeviceStackRoutes,
    RootStackParamList,
    RootStackRoutes,
    StackNavigationProps,
} from '@suite-native/navigation';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

const containerStyle = prepareNativeStyle(utils => ({
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: utils.borders.radii.r12,
    borderWidth: 1,
    borderColor: utils.colors.backgroundAlertBlueSubtleOnElevationNegative,
    backgroundColor: utils.colors.backgroundAlertBlueSubtleOnElevation1,
    padding: utils.spacings.sp16,
    gap: utils.spacings.sp12,
    marginHorizontal: utils.spacings.sp16,
}));

const flex1Style = {
    flex: 1,
};

type CloseStateItem = {
    deviceId: string;
    version: string;
};
const closeStateAtom = atom<CloseStateItem[]>([]);

export const FirmwareUpdateAlert = () => {
    const { applyStyle } = useNativeStyles();
    const updateFirmwareVersion = useSelector(selectDeviceUpdateFirmwareVersion);
    const deviceReleaseInfo = useSelector(selectDeviceReleaseInfo);
    const isPortfolioTrackerDevice = useSelector(selectIsPortfolioTrackerDevice);
    const deviceId = useSelector(selectDeviceId);
    const isConnected = useSelector(selectIsDeviceConnected);
    const isDeviceBackedUp = useSelector(selectIsDeviceBackedUp);
    const deviceState = useSelector(selectDeviceState);
    const isDiscoveryRunning = useSelector((state: DiscoveryRootState & DeviceRootState) =>
        selectIsDiscoveryActiveByDeviceState(state, deviceState),
    );
    const navigation =
        useNavigation<StackNavigationProps<RootStackParamList, RootStackRoutes.AppTabs>>();
    const setCloseState = useSetAtom(closeStateAtom);

    const isClosedAtom = useMemo(
        () =>
            atom(get =>
                get(closeStateAtom).some(
                    item => item.deviceId === deviceId && item.version === updateFirmwareVersion,
                ),
            ),
        [deviceId, updateFirmwareVersion],
    );

    const isClosed = useAtomValue(isClosedAtom);
    const isFirmwareUpdateEnabled = useIsFirmwareUpdateFeatureEnabled();

    const isUpgradable = deviceReleaseInfo?.isNewer;

    const handleUpdateFirmware = () => {
        navigation.navigate(RootStackRoutes.DeviceSettingsStack, {
            screen: DeviceStackRoutes.ConfirmFirmwareUpdate,
        });
    };

    const handleClose = () => {
        if (!deviceId || !updateFirmwareVersion) return;

        setCloseState(prev => [...prev, { deviceId, version: updateFirmwareVersion }]);
    };

    if (!isFirmwareUpdateEnabled) {
        return null;
    }

    if (
        !isUpgradable ||
        isPortfolioTrackerDevice ||
        isDiscoveryRunning ||
        !isConnected ||
        !isDeviceBackedUp ||
        isClosed
    ) {
        return null;
    }

    return (
        <Animated.View style={applyStyle(containerStyle)} entering={FadeIn} exiting={FadeOut}>
            <Icon name="info" size="large" />
            <VStack spacing="sp12" style={flex1Style}>
                <Box>
                    <Text variant="highlight">
                        <Translation id="moduleHome.firmwareUpdateAlert.title" />
                    </Text>
                    <Text>
                        <Translation
                            id="moduleHome.firmwareUpdateAlert.version"
                            values={{ version: updateFirmwareVersion }}
                        />
                    </Text>
                </Box>
                <HStack spacing="sp8" style={flex1Style}>
                    <Button
                        size="small"
                        colorScheme="blueElevation0"
                        onPress={handleClose}
                        style={flex1Style}
                    >
                        <Translation id="moduleHome.firmwareUpdateAlert.button.close" />
                    </Button>
                    <Button
                        size="small"
                        colorScheme="blueBold"
                        onPress={handleUpdateFirmware}
                        style={flex1Style}
                    >
                        <Translation id="moduleHome.firmwareUpdateAlert.button.update" />
                    </Button>
                </HStack>
            </VStack>
        </Animated.View>
    );
};
