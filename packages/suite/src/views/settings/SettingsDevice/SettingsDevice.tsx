import { DeviceModelInternal, type TransportInfo } from '@trezor/connect';
import { isBitcoinOnlyDevice, pickByDeviceModel } from '@trezor/device-utils';
import { isDeviceRemembered } from '@suite-common/suite-utils';

import { DeviceBanner, SettingsLayout, SettingsSection } from 'src/components/settings';
import { Translation } from 'src/components/suite';
import { useDevice, useSelector } from 'src/hooks/suite';
import type { TrezorDevice } from 'src/types/suite';

import { BackupRecoverySeed } from './BackupRecoverySeed';
import { BackupFailed } from './BackupFailed';
import { CheckRecoverySeed } from './CheckRecoverySeed';
import { FirmwareVersion } from './FirmwareVersion';
import { FirmwareTypeChange } from './FirmwareTypeChange';
import { PinProtection } from './PinProtection';
import { ChangePin } from './ChangePin';
import { Passphrase } from './Passphrase';
import { SafetyChecks } from './SafetyChecks';
import { DeviceLabel } from './DeviceLabel';
import { Homescreen } from './Homescreen';
import { DisplayRotation } from './DisplayRotation';
import { AutoLock } from './AutoLock';
import { WipeDevice } from './WipeDevice';
import { CustomFirmware } from './CustomFirmware';
import { AuthenticateDevice } from './AuthenticateDevice';
import { DeviceAuthenticityOptOut } from './DeviceAuthenticityOptOut';

const deviceSettingsUnavailable = (device?: TrezorDevice, transport?: Partial<TransportInfo>) => {
    const noTransportAvailable = transport && !transport.type;
    const wrongDeviceType = device?.type && ['unacquired', 'unreadable'].includes(device.type);
    const wrongDeviceMode =
        (device?.mode && ['seedless'].includes(device.mode)) || device?.features?.recovery_mode;
    const firmwareUpdateRequired = device?.firmware === 'required';
    return noTransportAvailable || wrongDeviceType || wrongDeviceMode || firmwareUpdateRequired;
};

export const SettingsDevice = () => {
    const { device, isLocked } = useDevice();
    const transport = useSelector(state => state.suite.transport);

    const deviceUnavailable = !device?.features;
    const isDeviceLocked = isLocked();
    const bootloaderMode = device?.mode === 'bootloader';
    const initializeMode = device?.mode === 'initialize';
    const deviceRemembered = isDeviceRemembered(device) && !device?.connected;
    const deviceModelInternal = device?.features?.internal_model;
    const bitcoinOnlyDevice = isBitcoinOnlyDevice(device);
    const supportsDeviceAuthentication = deviceModelInternal === DeviceModelInternal.T2B1;
    const supportsDisplayRotation = deviceModelInternal === DeviceModelInternal.T2T1;

    if (deviceSettingsUnavailable(device, transport)) {
        return (
            <SettingsLayout>
                <DeviceBanner
                    title={<Translation id="TR_SETTINGS_DEVICE_BANNER_TITLE_UNAVAILABLE" />}
                    description={
                        <Translation id="TR_SETTINGS_DEVICE_BANNER_DESCRIPTION_UNAVAILABLE" />
                    }
                />
            </SettingsLayout>
        );
    }

    if (deviceUnavailable) {
        return (
            <SettingsLayout>
                <DeviceBanner
                    title={<Translation id="TR_SETTINGS_DEVICE_BANNER_TITLE_DISCONNECTED" />}
                />
            </SettingsLayout>
        );
    }

    const {
        unfinished_backup: unfinishedBackup,
        pin_protection: pinProtection,
        safety_checks: safetyChecks,
    } = device.features;

    return (
        <SettingsLayout>
            {bootloaderMode && (
                <DeviceBanner
                    title={<Translation id="TR_SETTINGS_DEVICE_BANNER_TITLE_BOOTLOADER" />}
                    description={
                        <Translation
                            id={pickByDeviceModel(deviceModelInternal, {
                                default:
                                    'TR_SETTINGS_DEVICE_BANNER_DESCRIPTION_BOOTLOADER_NO_BUTTONS',
                                [DeviceModelInternal.T2T1]:
                                    'TR_SETTINGS_DEVICE_BANNER_DESCRIPTION_BOOTLOADER_NO_TOUCH',
                            })}
                        />
                    }
                />
            )}

            {deviceRemembered && (
                <DeviceBanner
                    title={<Translation id="TR_SETTINGS_DEVICE_BANNER_TITLE_REMEMBERED" />}
                />
            )}

            {!bootloaderMode && !initializeMode && (
                <SettingsSection title={<Translation id="TR_BACKUP" />} icon="NEWSPAPER">
                    {unfinishedBackup ? (
                        <BackupFailed />
                    ) : (
                        <>
                            <BackupRecoverySeed isDeviceLocked={isDeviceLocked} />
                            <CheckRecoverySeed isDeviceLocked={isDeviceLocked} />
                        </>
                    )}
                </SettingsSection>
            )}

            <SettingsSection title={<Translation id="TR_FIRMWARE" />} icon="FIRMWARE">
                <FirmwareVersion isDeviceLocked={isDeviceLocked} />
                {(!bootloaderMode || bitcoinOnlyDevice) && (
                    <FirmwareTypeChange isDeviceLocked={isDeviceLocked} />
                )}
            </SettingsSection>

            {!bootloaderMode && !initializeMode && (
                <>
                    <SettingsSection
                        title={<Translation id="TR_DEVICE_SECURITY" />}
                        icon="SHIELD_CHECK"
                    >
                        <PinProtection isDeviceLocked={isDeviceLocked} />
                        {pinProtection && <ChangePin isDeviceLocked={isDeviceLocked} />}
                        <Passphrase isDeviceLocked={isDeviceLocked} />
                        {safetyChecks && <SafetyChecks isDeviceLocked={isDeviceLocked} />}
                        {supportsDeviceAuthentication && <AuthenticateDevice />}
                    </SettingsSection>

                    <SettingsSection title={<Translation id="TR_PERSONALIZATION" />} icon="PALETTE">
                        <DeviceLabel isDeviceLocked={isDeviceLocked} />
                        <Homescreen isDeviceLocked={isDeviceLocked} />
                        {supportsDisplayRotation && (
                            <DisplayRotation isDeviceLocked={isDeviceLocked} />
                        )}
                        {pinProtection && <AutoLock isDeviceLocked={isDeviceLocked} />}
                    </SettingsSection>
                </>
            )}

            <SettingsSection title={<Translation id="TR_ADVANCED" />} icon="GHOST">
                <WipeDevice isDeviceLocked={isDeviceLocked} />
                <CustomFirmware />
                {supportsDeviceAuthentication && <DeviceAuthenticityOptOut />}
            </SettingsSection>
        </SettingsLayout>
    );
};
