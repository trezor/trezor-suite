import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSelector } from 'react-redux';
import { useMemo } from 'react';

import { useNavigation } from '@react-navigation/native';
import { atom, useAtomValue, useSetAtom } from 'jotai';

import { Box, Button, HStack, VStack, Text } from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import {
    DeviceRootState,
    DiscoveryRootState,
    selectDeviceId,
    selectDeviceReleaseInfo,
    selectDeviceState,
    selectDeviceUpdateFirmwareVersion,
    selectIsDeviceConnectedAndAuthorized,
    selectIsDiscoveryActiveByDeviceState,
    selectIsPortfolioTrackerDevice,
} from '@suite-common/wallet-core';
import {
    RootStackParamList,
    RootStackRoutes,
    StackNavigationProps,
    DeviceStackRoutes,
} from '@suite-native/navigation';
import { Translation } from '@suite-native/intl';
import { useIsFirmwareUpdateFeatureEnabled } from '@suite-native/firmware';

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
    const isConnected = useSelector(selectIsDeviceConnectedAndAuthorized);
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
            screen: DeviceStackRoutes.FirmwareUpdate,
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
                    <Button colorScheme="blueElevation0" onPress={handleClose} style={flex1Style}>
                        <Translation id="moduleHome.firmwareUpdateAlert.button.close" />
                    </Button>
                    <Button
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
