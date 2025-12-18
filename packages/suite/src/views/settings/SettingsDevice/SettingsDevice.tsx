import { Context } from '@suite-common/message-system';
import { SUPPORTS_DEVICE_AUTHENTICITY_CHECK } from '@suite-common/suite-constants';
import { isDeviceRemembered } from '@suite-common/suite-utils';

import { DeviceBanner } from 'src/components/settings/DeviceBanner';
import { SettingsLayout } from 'src/components/settings/SettingsLayout';
import { SettingsSection } from 'src/components/settings/SettingsSection';
import { Translation } from 'src/components/suite/Translation';
import { ContextMessage } from 'src/components/wallet/WalletLayout/AccountBanners/ContextMessage';
import { useDevice, useSelector } from 'src/hooks/suite';
import { selectHasActiveTransport } from 'src/selectors/suite/suiteSelectors';
import type { TrezorDevice } from 'src/types/suite';
import { getHowToGetFromBootloaderInstructionsMap } from 'src/utils/device/bootloader';
import { isRecoveryInProgress } from 'src/utils/device/isRecoveryInProgress';

import { BackupFailed } from './BackupFailed';
import { BackupRecoverySeed } from './BackupRecoverySeed';
import { ChangePin } from './ChangePin';
import { CheckRecoverySeed } from './CheckRecoverySeed';
import { DeviceLabel } from './DeviceLabel';
import { FirmwareVersion } from './FirmwareVersion';
import { MultiShareBackup } from './MultiShareBackup';
import { Passphrase } from './Passphrase';
import { PinProtection } from './PinProtection';

const deviceSettingsUnavailable = (device?: TrezorDevice) => {
    const wrongDeviceType = device?.type && ['unacquired', 'unreadable'].includes(device.type);
    const wrongDeviceMode =
        (device?.mode && ['seedless'].includes(device.mode)) ||
        (device?.features !== undefined && isRecoveryInProgress(device?.features));
    const firmwareUpdateRequired = device?.firmware === 'required';

    return wrongDeviceType || wrongDeviceMode || firmwareUpdateRequired;
};

export const SettingsDevice = () => {
    const { device, isLocked } = useDevice();
    const noTransportAvailable = !useSelector(selectHasActiveTransport);
    const deviceUnavailable = !device?.features;
    const isDeviceLocked = isLocked();
    const bootloaderMode = device?.mode === 'bootloader';
    const initializeMode = device?.mode === 'initialize';
    const isNormalMode = !bootloaderMode && !initializeMode;
    const deviceRemembered = isDeviceRemembered(device) && !device?.connected;

    if (noTransportAvailable || deviceSettingsUnavailable(device)) {
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

    const { unfinished_backup: unfinishedBackup, pin_protection: pinProtection } = device.features;

    const deviceModelInternal = device.features.internal_model;

    const supportsDeviceAuthentication = SUPPORTS_DEVICE_AUTHENTICITY_CHECK[deviceModelInternal];
    // because Device authenticity check is something you can (and have to) do on a device with FW but without seed
    const isSecuritySectionVisible =
        isNormalMode || (initializeMode && supportsDeviceAuthentication);

    const bootloaderDescription = getHowToGetFromBootloaderInstructionsMap({ deviceModelInternal });

    return (
        <SettingsLayout>
            <ContextMessage context={Context.getSettings('device')} />

            {bootloaderMode && (
                <DeviceBanner
                    title={<Translation id="TR_SETTINGS_DEVICE_BANNER_TITLE_BOOTLOADER" />}
                    description={
                        bootloaderDescription !== null ? (
                            <Translation id={bootloaderDescription} />
                        ) : null
                    }
                />
            )}

            {deviceRemembered && (
                <DeviceBanner
                    title={<Translation id="TR_SETTINGS_DEVICE_BANNER_TITLE_REMEMBERED" />}
                />
            )}

            {isNormalMode && (
                <SettingsSection title={<Translation id="TR_BACKUP" />} icon="newspaper">
                    {unfinishedBackup ? (
                        <BackupFailed />
                    ) : (
                        <>
                            <BackupRecoverySeed isDeviceLocked={isDeviceLocked} />
                            <MultiShareBackup isDeviceLocked={isDeviceLocked} />
                            <CheckRecoverySeed isDeviceLocked={isDeviceLocked} />
                        </>
                    )}
                </SettingsSection>
            )}

            <SettingsSection title={<Translation id="TR_PASSPHRASE" />} icon="password">
                <Passphrase isDeviceLocked={isDeviceLocked} />
            </SettingsSection>

            <SettingsSection title={<Translation id="TR_FIRMWARE" />} icon="puzzlePiece">
                <FirmwareVersion isDeviceLocked={isDeviceLocked} />
            </SettingsSection>

            {isSecuritySectionVisible && (
                <SettingsSection title={<Translation id="TR_DEVICE_SECURITY" />} icon="shieldCheck">
                    {isNormalMode && (
                        <>
                            <PinProtection isDeviceLocked={isDeviceLocked} />
                            {pinProtection && <ChangePin isDeviceLocked={isDeviceLocked} />}
                        </>
                    )}
                </SettingsSection>
            )}

            {isNormalMode && (
                <SettingsSection title={<Translation id="TR_PERSONALIZATION" />} icon="palette">
                    <DeviceLabel isDeviceLocked={isDeviceLocked} />
                </SettingsSection>
            )}
        </SettingsLayout>
    );
};
