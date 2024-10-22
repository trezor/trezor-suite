import { ReactNode } from 'react';
import { useSelector } from 'react-redux';

import { G } from '@mobily/ts-belt';

import { getFwUpdateVersion } from '@suite-common/suite-utils';
import { deviceModelToIconName } from '@suite-native/icons';
import {
    selectDevice,
    selectDeviceModel,
    selectDeviceReleaseInfo,
} from '@suite-common/wallet-core';
import { HStack, Text, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import { getFirmwareVersion, hasBitcoinOnlyFirmware } from '@trezor/device-utils';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

import { DeviceSettingsCard } from './DeviceSettingsCard';

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

export const DeviceFirmwareCard = () => {
    const device = useSelector(selectDevice);
    const deviceModel = useSelector(selectDeviceModel);
    const deviceReleaseInfo = useSelector(selectDeviceReleaseInfo);

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

            if (isUpgradable) {
                return {
                    title: (
                        <Translation
                            id="moduleDeviceSettings.firmware.newVersionAvailable"
                            values={{ version: getFwUpdateVersion(device) }}
                        />
                    ),
                    variant: 'info',
                } as const;
            }

            return {
                title: <Translation id="moduleDeviceSettings.firmware.upToDate" />,
                variant: 'success',
            } as const;
        }

        return undefined;
    })();

    return (
        <DeviceSettingsCard
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
        </DeviceSettingsCard>
    );
};
