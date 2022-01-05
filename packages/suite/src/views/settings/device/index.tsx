import React from 'react';
import { SettingsLayout } from '@settings-components';
import { Translation } from '@suite-components';
import { Section, DeviceBanner } from '@suite-components/Settings';
import { getDeviceModel, isDeviceRemembered } from '@suite-utils/device';
import { useDevice } from '@suite-hooks';

import BackupRecoverySeed from './BackupRecoverySeed';
import BackupFailed from './BackupFailed';
import CheckRecoverySeed from './CheckRecoverySeed';
import FirmwareVersion from './FirmwareVersion';
import PinProtection from './PinProtection';
import ChangePin from './ChangePin';
import Passphrase from './Passphrase';
import SafetyChecks from './SafetyChecks';
import DeviceLabel from './DeviceLabel';
import Homescreen from './Homescreen';
import DisplayRotation from './DisplayRotation';
import AutoLock from './AutoLock';
import WipeDevice from './WipeDevice';
import CustomFirmware from './CustomFirmware';

const Settings = () => {
    const { device, isLocked } = useDevice();
    const isDeviceLocked = isLocked();
    const bootloaderMode = device?.mode === 'bootloader';
    const deviceRemembered = isDeviceRemembered(device) && !device?.connected;
    const deviceModel = device ? getDeviceModel(device) : undefined;

    if (!device?.features) {
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
                            id={
                                deviceModel === '1'
                                    ? 'TR_SETTINGS_DEVICE_BANNER_DESCRIPTION_BOOTLOADER_MODEL_1'
                                    : 'TR_SETTINGS_DEVICE_BANNER_DESCRIPTION_BOOTLOADER_MODEL_2'
                            }
                        />
                    }
                />
            )}

            {deviceRemembered && (
                <DeviceBanner
                    title={<Translation id="TR_SETTINGS_DEVICE_BANNER_TITLE_REMEMBERED" />}
                />
            )}

            {!bootloaderMode && (
                <Section title={<Translation id="TR_BACKUP" />}>
                    {unfinishedBackup ? (
                        <BackupFailed />
                    ) : (
                        <>
                            <BackupRecoverySeed isDeviceLocked={isDeviceLocked} />
                            <CheckRecoverySeed isDeviceLocked={isDeviceLocked} />
                        </>
                    )}
                </Section>
            )}

            <Section title={<Translation id="TR_DEVICE_SECURITY" />}>
                <FirmwareVersion isDeviceLocked={isDeviceLocked} />

                {!bootloaderMode && (
                    <>
                        <PinProtection isDeviceLocked={isDeviceLocked} />
                        {pinProtection && <ChangePin isDeviceLocked={isDeviceLocked} />}
                        <Passphrase isDeviceLocked={isDeviceLocked} />
                        {safetyChecks && <SafetyChecks isDeviceLocked={isDeviceLocked} />}
                    </>
                )}
            </Section>
            {!bootloaderMode && (
                <Section title={<Translation id="TR_PERSONALIZATION" />}>
                    <DeviceLabel isDeviceLocked={isDeviceLocked} />
                    <Homescreen isDeviceLocked={isDeviceLocked} />
                    {deviceModel === 'T' && <DisplayRotation isDeviceLocked={isDeviceLocked} />}
                    {pinProtection && <AutoLock isDeviceLocked={isDeviceLocked} />}
                </Section>
            )}
            <Section title={<Translation id="TR_ADVANCED" />}>
                <WipeDevice isDeviceLocked={isDeviceLocked} />
                <CustomFirmware isDeviceLocked={isDeviceLocked} />
            </Section>
        </SettingsLayout>
    );
};

export default Settings;
