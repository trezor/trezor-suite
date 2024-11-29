import { ReactNode } from 'react';
import { useSelector } from 'react-redux';

import { G } from '@mobily/ts-belt';
import { useNavigation } from '@react-navigation/native';

import { getFwUpdateVersion } from '@suite-common/suite-utils';
import { deviceModelToIconName } from '@suite-native/icons';
import {
    DeviceRootState,
    DiscoveryRootState,
    selectDevice,
    selectDeviceModel,
    selectDeviceReleaseInfo,
    selectIsDiscoveryActiveByDeviceState,
} from '@suite-common/wallet-core';
import { Button, HStack, Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { getFirmwareVersion, hasBitcoinOnlyFirmware } from '@trezor/device-utils';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';
import {
    DeviceStackRoutes,
    StackNavigationProps,
    DeviceSettingsStackParamList,
} from '@suite-native/navigation';
import { isDevelopOrDebugEnv } from '@suite-native/config';

import { DeviceSettingsCardLayout } from './DeviceSettingsCardLayout';

const firmwareInfoStyle = prepareNativeStyle(() => ({
    flexGrow: 1,
}));

type DeviceInfoProps = {
    label: ReactNode;
    value: ReactNode;
};

const FirmwareInfo = ({ label, value }: DeviceInfoProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <VStack spacing="sp2" style={applyStyle(firmwareInfoStyle)}>
            <Text variant="hint" color="textSubdued">
                {label}
            </Text>
            <Text variant="callout">{value}</Text>
        </VStack>
    );
};

type NavigationProp = StackNavigationProps<
    DeviceSettingsStackParamList,
    DeviceStackRoutes.FirmwareUpdate
>;

// TODO: remove this once we finish debugging firmware update
const allowReinstall = isDevelopOrDebugEnv();

export const DeviceFirmwareCard = () => {
    const device = useSelector(selectDevice);
    const deviceModel = useSelector(selectDeviceModel);
    const deviceReleaseInfo = useSelector(selectDeviceReleaseInfo);
    const isDiscoveryRunning = useSelector((state: DiscoveryRootState & DeviceRootState) =>
        selectIsDiscoveryActiveByDeviceState(state, device?.state),
    );
    const navigation = useNavigation<NavigationProp>();

    if (!device || !deviceModel) {
        return null;
    }

    const firmwareVersion = getFirmwareVersion(device);
    const firmwareTypeTranslationId = hasBitcoinOnlyFirmware(device)
        ? 'moduleDeviceSettings.firmware.typeBitcoinOnly'
        : 'moduleDeviceSettings.firmware.typeUniversal';

    const firmwareUpdateProps = (() => {
        if (G.isNotNullable(deviceReleaseInfo)) {
            const isUpgradable = deviceReleaseInfo.isNewer ?? false;

            if (isUpgradable || allowReinstall) {
                return {
                    title: (
                        <Translation
                            id="moduleDeviceSettings.firmware.updateCard.newVersionAvailable"
                            values={{ version: getFwUpdateVersion(device) }}
                        />
                    ),
                    variant: 'info',
                    rightButton: (
                        <Button
                            colorScheme="blueBold"
                            size="small"
                            onPress={() => {
                                navigation.navigate(DeviceStackRoutes.FirmwareUpdate);
                            }}
                            isDisabled={isDiscoveryRunning}
                            isLoading={isDiscoveryRunning}
                        >
                            <Translation id="moduleDeviceSettings.firmware.updateCard.updateButton" />
                        </Button>
                    ),
                } as const;
            }

            return {
                title: <Translation id="moduleDeviceSettings.firmware.updateCard.upToDate" />,
                variant: 'success',
            } as const;
        }

        return undefined;
    })();

    return (
        <DeviceSettingsCardLayout
            icon={deviceModelToIconName(deviceModel)}
            title={<Translation id="moduleDeviceSettings.firmware.title" />}
            alertBoxProps={firmwareUpdateProps}
        >
            <HStack marginTop="sp12" spacing="sp2">
                <FirmwareInfo
                    label={<Translation id="moduleDeviceSettings.firmware.version" />}
                    value={firmwareVersion}
                />
                <FirmwareInfo
                    label={<Translation id="moduleDeviceSettings.firmware.type" />}
                    value={<Translation id={firmwareTypeTranslationId} />}
                />
            </HStack>
        </DeviceSettingsCardLayout>
    );
};
