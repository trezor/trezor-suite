import {
    BackupFailed,
    BackupRecoverySeed,
    CreateWalletBackup,
    MultiShareBackup,
} from '@suite/backup';
import { setConnectionModal, useDevice } from '@suite/device';
import { Translation } from '@suite/intl';
import { ContextMessage } from '@suite/message-system';
import { isRecoveryInProgress } from '@suite/recovery';
import { selectIsDeviceAuthenticityCheckSupported } from '@suite-common/device';
import { Context } from '@suite-common/message-system';
import { getIsDeviceRemembered } from '@suite-common/suite-utils';
import { Banner } from '@trezor/components';
import { isBitcoinOnlyDevice } from '@trezor/device-utils';
import {
    GhostIcon,
    NewspaperIcon,
    PaletteIcon,
    PasswordIcon,
    PlugsIcon,
    PuzzlePieceIcon,
    ShieldCheckIcon,
    ShieldWarningIcon,
    TrezorLogoIcon,
} from '@trezor/icons';
import { SettingsSection } from '@trezor/product-components';
import { breakpoints } from '@trezor/theme';

import { DeviceBanner } from 'src/components/settings/DeviceBanner';
import { SettingsLayout } from 'src/components/settings/SettingsLayout';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { selectHasActiveTransport } from 'src/selectors/suite/suiteSelectors';
import { useIsContentBelowBreakpoint } from 'src/support/suite/ContentFlex';
import type { TrezorDevice } from 'src/types/suite';
import { getHowToGetFromBootloaderInstructionsMap } from 'src/utils/device/bootloader';

import { AuthenticateDevice } from './AuthenticateDevice';
import { AutoLock } from './AutoLock';
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
import {
    NoDeviceEshopSettingsBanner,
    selectShouldShowNoDeviceEshopSettingsBanner,
} from './NoDeviceEshopSettingsBanner';
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
    const hasContentBelowTabletWidth = useIsContentBelowBreakpoint(breakpoints.tablet);
    const hasContentBelowLaptopWidth = useIsContentBelowBreakpoint(breakpoints.laptop);
    const { device, isLocked } = useDevice();
    const noTransportAvailable = !useSelector(selectHasActiveTransport);
    const deviceUnavailable = !device?.features;
    const isDeviceLocked = isLocked();
    const bootloaderMode = device?.mode === 'bootloader';
    const initializeMode = device?.mode === 'initialize';
    const isNormalMode = !bootloaderMode && !initializeMode;
    const deviceRemembered = getIsDeviceRemembered(device) && !device?.connected;
    const bitcoinOnlyDevice = isBitcoinOnlyDevice(device);
    const shouldShowNoDeviceEshopBanner = useSelector(selectShouldShowNoDeviceEshopSettingsBanner);
    const supportsDeviceAuthentication = useSelector(selectIsDeviceAuthenticityCheckSupported);

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
                {shouldShowNoDeviceEshopBanner && (
                    <SettingsSection
                        title={<Translation id="TR_TREZOR_WALLET" />}
                        hasContainer={false}
                        icon={TrezorLogoIcon}
                        hasVerticalLayout={hasContentBelowLaptopWidth}
                    >
                        <NoDeviceEshopSettingsBanner />
                    </SettingsSection>
                )}
            </SettingsLayout>
        );
    }

    const {
        unfinished_backup: unfinishedBackup,
        pin_protection: pinProtection,
        safety_checks: safetyChecks,
    } = device.features;

    const deviceModelInternal = device.features.internal_model;

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
                    hasVerticalLayout={hasContentBelowTabletWidth}
                    title={<Translation id="TR_BACKUP" />}
                    icon={NewspaperIcon}
                >
                    {unfinishedBackup ? (
                        <BackupFailed />
                    ) : (
                        <>
                            <BackupRecoverySeed isDeviceLocked={isDeviceLocked} />
                            <MultiShareBackup isDeviceLocked={isDeviceLocked} />
                            <CheckRecoverySeed isDeviceLocked={isDeviceLocked} />
                            <CreateWalletBackup isDeviceLocked={isDeviceLocked} />
                        </>
                    )}
                </SettingsSection>
            )}

            <SettingsSection
                hasVerticalLayout={hasContentBelowTabletWidth}
                title={<Translation id="TR_PASSPHRASE" />}
                icon={PasswordIcon}
            >
                <Passphrase isDeviceLocked={isDeviceLocked} />
            </SettingsSection>

            <SettingsSection
                hasVerticalLayout={hasContentBelowTabletWidth}
                title={<Translation id="TR_FIRMWARE" />}
                icon={PuzzlePieceIcon}
            >
                <FirmwareVersion isDeviceLocked={isDeviceLocked} />
                {(!bootloaderMode || bitcoinOnlyDevice) && (
                    <FirmwareTypeChange isDeviceLocked={isDeviceLocked} />
                )}
                <ChangeLanguage isDeviceLocked={isDeviceLocked} />
            </SettingsSection>

            {isSecuritySectionVisible && (
                <SettingsSection
                    hasVerticalLayout={hasContentBelowTabletWidth}
                    title={<Translation id="TR_DEVICE_SECURITY" />}
                    icon={ShieldCheckIcon}
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
                    hasVerticalLayout={hasContentBelowTabletWidth}
                    title={<Translation id="TR_PERSONALIZATION" />}
                    icon={PaletteIcon}
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
                hasVerticalLayout={hasContentBelowTabletWidth}
                title={<Translation id="TR_DEVICE_CONNECTION" />}
                icon={PlugsIcon}
            >
                {isThpDevice && <ThpAutoconnect isDeviceLocked={isDeviceLocked} />}
                <ForgetDevice />
            </SettingsSection>

            <SettingsSection
                hasVerticalLayout={hasContentBelowTabletWidth}
                title={<Translation id="TR_SETTINGS_ADVANCED" />}
                icon={ShieldWarningIcon}
            >
                <DeviceAuthenticityOptOut
                    isDeviceAuthenticityCheckSupported={supportsDeviceAuthentication}
                />
                <FirmwareAuthenticityChecks />
            </SettingsSection>

            <SettingsSection
                hasVerticalLayout={hasContentBelowTabletWidth}
                title={<Translation id="TR_ADVANCED" />}
                icon={GhostIcon}
            >
                <WipeDevice isDeviceLocked={isDeviceLocked} />
                {isNormalMode && <WipeCode isDeviceLocked={isDeviceLocked} />}
                <CustomFirmware />
            </SettingsSection>
        </SettingsLayout>
    );
};
