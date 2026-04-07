import { Translation } from '@suite/intl';
import { isRecoveryInProgress } from '@suite/recovery';
import { Context } from '@suite-common/message-system';
import { SUPPORTS_DEVICE_AUTHENTICITY_CHECK } from '@suite-common/suite-constants';
import { getIsDeviceRemembered } from '@suite-common/suite-utils';
import { Banner } from '@trezor/components';
import { isBitcoinOnlyDevice } from '@trezor/device-utils';
import { SettingsSection } from '@trezor/product-components';

import { setConnectionModal } from 'src/actions/device/deviceSlice';
import { DeviceBanner } from 'src/components/settings/DeviceBanner';
import { SettingsLayout } from 'src/components/settings/SettingsLayout';
import { ContextMessage } from 'src/components/wallet/WalletLayout/AccountBanners/ContextMessage';
import { useDevice, useDispatch, useLayoutSize, useSelector } from 'src/hooks/suite';
import { selectHasActiveTransport } from 'src/selectors/suite/suiteSelectors';
import type { TrezorDevice } from 'src/types/suite';
import { getHowToGetFromBootloaderInstructionsMap } from 'src/utils/device/bootloader';

import { AuthenticateDevice } from './AuthenticateDevice';
import { AutoLock } from './AutoLock';
import { BackupFailed } from './BackupFailed';
import { BackupRecoverySeed } from './BackupRecoverySeed';
import { Brightness } from './Brightness';
import { ChangeLanguage } from './ChangeLanguage';
import { ChangePin } from './ChangePin';
import { CheckRecoverySeed } from './CheckRecoverySeed';
import { CustomFirmware } from './CustomFirmware';
import { DeviceAuthenticityOptOut } from './DeviceAuthenticityOptOut';
import { DeviceLabel } from './DeviceLabel';
import { DisplayRotation } from './DisplayRotation';
import { FirmwareAuthenticityChecks } from './FirmwareAuthenticityChecks';
import { FirmwareTypeChange } from './FirmwareTypeChange';
import { FirmwareVersion } from './FirmwareVersion';
import { ForgetDevice } from './ForgetDevice';
import { HapticFeedback } from './HapticFeedback';
import { Homescreen } from './Homescreen';
import { MultiShareBackup } from './MultiShareBackup';
import { Passphrase } from './Passphrase';
import { PinProtection } from './PinProtection';
import { SafetyChecks } from './SafetyChecks';
import { ThpAutoconnect } from './ThpAutoconnect';
import { WipeCode } from './WipeCode';
import { WipeDevice } from './WipeDevice/WipeDevice';

const deviceSettingsUnavailable = (device?: TrezorDevice) => {
    const wrongDeviceType = device?.type && ['unacquired', 'unreadable'].includes(device.type);
    const wrongDeviceMode =
        (device?.mode && ['seedless'].includes(device.mode)) ||
        (device?.features !== undefined && isRecoveryInProgress(device?.features));
    const firmwareUpdateRequired = device?.firmware === 'required';

    return wrongDeviceType || wrongDeviceMode || firmwareUpdateRequired;
};

export const SettingsDevice = () => {
    const dispatch = useDispatch();
    const { isBelowLaptop } = useLayoutSize();
    const { device, isLocked } = useDevice();
    const noTransportAvailable = !useSelector(selectHasActiveTransport);
    const deviceUnavailable = !device?.features;
    const isDeviceLocked = isLocked();
    const bootloaderMode = device?.mode === 'bootloader';
    const initializeMode = device?.mode === 'initialize';
    const isNormalMode = !bootloaderMode && !initializeMode;
    const deviceRemembered = getIsDeviceRemembered(device) && !device?.connected;
    const bitcoinOnlyDevice = isBitcoinOnlyDevice(device);

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
                    intent="info"
                    title={<Translation id="TR_SETTINGS_DEVICE_BANNER_TITLE_DISCONNECTED" />}
                    description={
                        <Translation id="TR_SETTINGS_DEVICE_BANNER_DESCRIPTION_DISCONNECTED" />
                    }
                    rightContent={
                        <Banner.Button onClick={() => dispatch(setConnectionModal(true))}>
                            <Translation id="TR_CONNECT" />
                        </Banner.Button>
                    }
                />
            </SettingsLayout>
        );
    }

    const {
        unfinished_backup: unfinishedBackup,
        pin_protection: pinProtection,
        safety_checks: safetyChecks,
    } = device.features;

    const deviceModelInternal = device.features.internal_model;

    const supportsDeviceAuthentication = SUPPORTS_DEVICE_AUTHENTICITY_CHECK[deviceModelInternal];
    // because Device authenticity check is something you can (and have to) do on a device with FW but without seed
    const isSecuritySectionVisible =
        isNormalMode || (initializeMode && supportsDeviceAuthentication);

    const isThpDevice = device?.thp !== undefined;

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
                <SettingsSection
                    isBelowLaptop={isBelowLaptop}
                    title={<Translation id="TR_BACKUP" />}
                    icon="newspaper"
                >
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

            <SettingsSection
                isBelowLaptop={isBelowLaptop}
                title={<Translation id="TR_PASSPHRASE" />}
                icon="password"
            >
                <Passphrase isDeviceLocked={isDeviceLocked} />
            </SettingsSection>

            <SettingsSection
                isBelowLaptop={isBelowLaptop}
                title={<Translation id="TR_FIRMWARE" />}
                icon="puzzlePiece"
            >
                <FirmwareVersion isDeviceLocked={isDeviceLocked} />
                {(!bootloaderMode || bitcoinOnlyDevice) && (
                    <FirmwareTypeChange isDeviceLocked={isDeviceLocked} />
                )}
                <ChangeLanguage isDeviceLocked={isDeviceLocked} />
            </SettingsSection>

            {isSecuritySectionVisible && (
                <SettingsSection
                    isBelowLaptop={isBelowLaptop}
                    title={<Translation id="TR_DEVICE_SECURITY" />}
                    icon="shieldCheck"
                >
                    {isNormalMode && (
                        <>
                            <PinProtection isDeviceLocked={isDeviceLocked} />
                            {pinProtection && <ChangePin isDeviceLocked={isDeviceLocked} />}
                            {safetyChecks && <SafetyChecks isDeviceLocked={isDeviceLocked} />}
                        </>
                    )}
                    {supportsDeviceAuthentication && (
                        <AuthenticateDevice isDeviceLocked={isDeviceLocked} />
                    )}
                </SettingsSection>
            )}

            {isNormalMode && (
                <SettingsSection
                    isBelowLaptop={isBelowLaptop}
                    title={<Translation id="TR_PERSONALIZATION" />}
                    icon="palette"
                >
                    <DeviceLabel isDeviceLocked={isDeviceLocked} />
                    <Homescreen isDeviceLocked={isDeviceLocked} />
                    <DisplayRotation isDeviceLocked={isDeviceLocked} />
                    <Brightness isDeviceLocked={isDeviceLocked} />
                    <HapticFeedback isDeviceLocked={isDeviceLocked} />
                    {pinProtection && <AutoLock isDeviceLocked={isDeviceLocked} />}
                </SettingsSection>
            )}

            <SettingsSection
                isBelowLaptop={isBelowLaptop}
                title={<Translation id="TR_DEVICE_CONNECTION" />}
                icon="plugs"
            >
                {isThpDevice && <ThpAutoconnect isDeviceLocked={isDeviceLocked} />}
                <ForgetDevice />
            </SettingsSection>

            <SettingsSection
                isBelowLaptop={isBelowLaptop}
                title={<Translation id="TR_ADVANCED" />}
                icon="ghost"
            >
                <WipeDevice isDeviceLocked={isDeviceLocked} />
                {isNormalMode && <WipeCode isDeviceLocked={isDeviceLocked} />}
                <CustomFirmware />
                {supportsDeviceAuthentication && <DeviceAuthenticityOptOut />}
                <FirmwareAuthenticityChecks />
            </SettingsSection>
        </SettingsLayout>
    );
};
