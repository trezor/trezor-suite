import { ReactNode } from 'react';
import { useSelector } from 'react-redux';

import { G } from '@mobily/ts-belt';
import { useNavigation } from '@react-navigation/native';

import { getFwUpdateVersion } from '@suite-common/suite-utils';
import {
    selectDeviceModel,
    selectDeviceReleaseInfo,
    selectIsDeviceBackedUp,
    selectIsDeviceDiscoveryActive,
    selectSelectedDevice,
} from '@suite-common/wallet-core';
import { Button, HStack, Text, VStack } from '@suite-native/atoms';
import { isDevelopOrDebugEnv } from '@suite-native/config';
import { useIsFirmwareUpdateFeatureEnabled } from '@suite-native/firmware';
import { deviceModelToIconName } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import {
    DeviceSettingsStackParamList,
    DeviceStackRoutes,
    StackNavigationProps,
} from '@suite-native/navigation';
import { SettingsCardWithIconLayout } from '@suite-native/settings';
import { getFirmwareVersion, hasBitcoinOnlyFirmware } from '@trezor/device-utils';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

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
    DeviceStackRoutes.ConfirmFirmwareUpdate
>;

// TODO: remove this once we finish debugging firmware update
const allowReinstall = isDevelopOrDebugEnv();

export const DeviceFirmwareCard = () => {
    const device = useSelector(selectSelectedDevice);
    const deviceModel = useSelector(selectDeviceModel);
    const deviceReleaseInfo = useSelector(selectDeviceReleaseInfo);
    const isDeviceBackedUp = useSelector(selectIsDeviceBackedUp);
    const isDiscoveryRunning = useSelector(selectIsDeviceDiscoveryActive);

    const navigation = useNavigation<NavigationProp>();
    const isFirmwareUpdateEnabled = useIsFirmwareUpdateFeatureEnabled();

    if (!device || !deviceModel) {
        return null;
    }

    const firmwareVersion = getFirmwareVersion(device);
    const firmwareTypeTranslationId = hasBitcoinOnlyFirmware(device)
        ? 'firmware.typeBitcoinOnly'
        : 'firmware.typeUniversal';

    const firmwareUpdateProps = (() => {
        if (!isFirmwareUpdateEnabled || !isDeviceBackedUp) {
            return undefined;
        }

        if (G.isNotNullable(deviceReleaseInfo)) {
            const isUpgradable = deviceReleaseInfo.isNewer ?? false;

            if (isUpgradable || allowReinstall) {
                return {
                    title: (
                        <Translation
                            id="firmware.updateCard.newVersionAvailable"
                            values={{ version: getFwUpdateVersion(device) }}
                        />
                    ),
                    variant: 'info',
                    rightButton: (
                        <Button
                            colorScheme="blueBold"
                            size="small"
                            onPress={() => {
                                navigation.navigate(DeviceStackRoutes.ConfirmFirmwareUpdate);
                            }}
                            isDisabled={isDiscoveryRunning}
                            isLoading={isDiscoveryRunning}
                        >
                            <Translation id="firmware.updateCard.updateButton" />
                        </Button>
                    ),
                } as const;
            }

            return {
                title: <Translation id="firmware.updateCard.upToDate" />,
                variant: 'success',
            } as const;
        }

        return undefined;
    })();

    return (
        <SettingsCardWithIconLayout
            icon={deviceModelToIconName(deviceModel)}
            title={<Translation id="firmware.title" />}
            alertBoxProps={firmwareUpdateProps}
        >
            <HStack marginTop="sp12" spacing="sp2">
                <FirmwareInfo
                    label={<Translation id="firmware.version" />}
                    value={firmwareVersion}
                />
                <FirmwareInfo
                    label={<Translation id="firmware.type" />}
                    value={<Translation id={firmwareTypeTranslationId} />}
                />
            </HStack>
        </SettingsCardWithIconLayout>
    );
};
