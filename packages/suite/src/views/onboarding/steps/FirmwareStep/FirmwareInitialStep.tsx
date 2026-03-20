import { useState } from 'react';

import { Translation, useTranslation } from '@suite/intl';
import { OnboardingCard } from '@suite/onboarding-components';
import { selectIsDebugModeActive } from '@suite/settings';
import { selectDevices } from '@suite-common/device';
import { type AcquiredDevice } from '@suite-common/suite-types';
import { type ButtonProps, Card, Column, Link, Note, Row, Tooltip } from '@trezor/components';
import { FirmwareType } from '@trezor/connect';
import { DeviceModelInternal, isBitcoinOnlyDevice } from '@trezor/device-utils';

import { FirmwareOffer, FirmwareWarningsList, FirmwareWipeWarning } from 'src/components/firmware';
import { FirmwareLowBatteryModal } from 'src/components/firmware/FirmwareLowBatteryModal';
import { SkipStepConfirmation } from 'src/components/onboarding/SkipStepConfirmation';
import { PrerequisitesGuide } from 'src/components/suite';
import { useDevice, useOnboarding, useSelector } from 'src/hooks/suite';
import { useFirmwareDesktopUpdate } from 'src/hooks/suite/useFirmwareDesktopUpdate';

const InstallButton = ({ children, ...rest }: ButtonProps) => (
    <Tooltip
        cursor="default"
        isActive={rest.isDisabled}
        maxWidth={200}
        placement="bottom"
        content={<Translation id="TR_INSTALL_FW_DISABLED_MULTIPLE_DEVICES" />}
    >
        <OnboardingCard.Button data-testid="@firmware/install-button" {...rest}>
            {children}
        </OnboardingCard.Button>
    </Tooltip>
);

type GetDescriptionProps = {
    required: boolean;
    targetType: FirmwareType;
    switchFirmwareType?: boolean;
    isBitcoinOnlyAvailable?: boolean;
};

const getDescription = ({
    required,
    targetType,
    switchFirmwareType,
    isBitcoinOnlyAvailable,
}: GetDescriptionProps) => {
    if (switchFirmwareType) {
        if (!isBitcoinOnlyAvailable) {
            return 'TR_BITCOIN_ONLY_UNAVAILABLE';
        }

        return targetType === FirmwareType.BitcoinOnly
            ? 'TR_SWITCH_TO_BITCOIN_ONLY_DESCRIPTION'
            : 'TR_SWITCH_TO_REGULAR_DESCRIPTION';
    }

    if (required) {
        return 'TR_FIRMWARE_UPDATE_REQUIRED_EXPLAINED';
    }

    return 'TR_ONBOARDING_NEW_FW_DESCRIPTION';
};

const getNoFirmwareInstalledSubheading = (device: AcquiredDevice) => {
    const bitcoinOnlyDevice = isBitcoinOnlyDevice(device);

    if (bitcoinOnlyDevice) {
        // device.firmware === 'unknown' is for T1B1 in bootloader (most likely fresh or factory reset),
        // but T1B1 is never bitcoin-only device (meaning you can always choose Universal or BTC-only)
        return 'TR_FIRMWARE_SUBHEADING_BITCOIN_ONLY_DEVICE';
    }

    return device.firmware === 'none'
        ? 'TR_FIRMWARE_SUBHEADING_NONE'
        : 'TR_FIRMWARE_SUBHEADING_UNKNOWN';
};

type FirmwareInitialStepProps = {
    // This component is shared between Onboarding flow and standalone fw update modal with few minor UI changes
    // If it is set to true, then you know it is being rendered in standalone fw update modal
    onClose?: () => void;
};

export const FirmwareInitialStep = ({ onClose }: FirmwareInitialStepProps) => {
    const { device } = useDevice();
    const {
        deviceWillBeWiped,
        firmwareUpdate,
        setStatus,
        targetFirmwareType,
        toggleLowBatteryModal,
        showLowBatteryModal,
        switchFirmwareType,
    } = useFirmwareDesktopUpdate();
    const { isActive: isOnboarding, updateAnalytics } = useOnboarding();
    const { translationString } = useTranslation();
    const devices = useSelector(selectDevices);
    const isDebug = useSelector(selectIsDebugModeActive);

    const [bitcoinOnlyOffer, setBitcoinOnlyOffer] = useState(false);
    const [showSkipConfirmation, setShowSkipConfirmation] = useState(false);

    // Just to satisfy TS, disconnected device should be handled upstream.
    if (!device?.connected || !device?.features) {
        return null;
    }

    // This is essential for detecting potentially malicious devices,
    // as the firmware revision check is a critical part of the verification process.
    // In debug mode you may bypass it.
    // See: https://github.com/trezor/trezor-suite/issues/19157
    const isFirmwareInstallationMandatory =
        device.features.internal_model === DeviceModelInternal.T1B1 && !isDebug;

    // todo: move to utils device.ts
    const devicesConnected = devices.filter(device => device?.connected);
    const multipleDevicesConnected = [...new Set(devicesConnected.map(d => d.path))].length > 1;

    // The first condition is a defensive measure against https://github.com/trezor/trezor-suite/issues/17246, I could not reproduce the error.
    const shouldCheckSeed = !isOnboarding && device?.mode !== 'initialize';

    let content;

    const targetType = bitcoinOnlyOffer ? FirmwareType.BitcoinOnly : targetFirmwareType;
    // Bitcoin-only firmware is only available on T2T1 from v2.0.8 - older devices must first upgrade to 2.1.1 which does not have a Bitcoin-only variant
    const isBitcoinOnlyAvailable = !!device.firmwareReleaseConfigInfo?.isBitcoinOnlyAvailable;

    const installFirmware = (firmwareType: FirmwareType) => {
        firmwareUpdate({ firmwareType });
        updateAnalytics({ firmware: 'install' });
    };

    if (showLowBatteryModal) {
        return <FirmwareLowBatteryModal onClose={toggleLowBatteryModal} />;
    }

    if (bitcoinOnlyOffer) {
        // Installing Bitcoin-only firmware in onboarding
        content = {
            heading: (
                <Translation
                    id="TR_INSTALL_BITCOIN_ONLY_FW"
                    values={{
                        bitcoinOnly: <Translation id="TR_FIRMWARE_TYPE_BITCOIN_ONLY" />,
                    }}
                />
            ),
            description: (
                <Column alignItems="center" gap={12}>
                    <Translation id="TR_FIRMWARE_SUBHEADING_BITCOIN" />
                    <Note>
                        <Translation id="TR_CHANGE_FIRMWARE_TYPE_ANYTIME" />
                    </Note>
                </Column>
            ),
            innerActions: (
                <Row gap={16}>
                    <InstallButton
                        onClick={() => installFirmware(targetType)}
                        isDisabled={multipleDevicesConnected}
                    >
                        <Translation
                            id="TR_INSTALL_BITCOIN_ONLY"
                            values={{
                                bitcoinOnly: <Translation id="TR_FIRMWARE_TYPE_BITCOIN_ONLY" />,
                            }}
                        />
                    </InstallButton>
                    <InstallButton
                        intent="neutral"
                        priority="secondary"
                        onClick={() => installFirmware(FirmwareType.Universal)}
                        isDisabled={multipleDevicesConnected}
                    >
                        <Translation
                            id="TR_INSTALL_REGULAR"
                            values={{
                                regular: <Translation id="TR_FIRMWARE_TYPE_REGULAR" />,
                            }}
                        />
                    </InstallButton>
                </Row>
            ),
        };
    } else if (['none', 'unknown'].includes(device.firmware)) {
        // No firmware installed
        // Device without firmware is already in bootloader mode even if it doesn't report it
        content = {
            heading: <Translation id="TR_INSTALL_FIRMWARE" />,
            description: (
                <Translation
                    id={getNoFirmwareInstalledSubheading(device)}
                    values={{
                        i: chunks => <i>{chunks}</i>,
                        button: chunks => (
                            <Link onClick={() => setBitcoinOnlyOffer(true)}>{chunks}</Link>
                        ),
                        bitcoinOnly: translationString('TR_FIRMWARE_TYPE_BITCOIN_ONLY'),
                    }}
                />
            ),
            innerActions: (
                <InstallButton
                    onClick={() => installFirmware(targetType)}
                    isDisabled={multipleDevicesConnected}
                >
                    <Translation id="TR_INSTALL" />
                </InstallButton>
            ),
        };
    } else if (device.mode === 'bootloader') {
        // We can check if device.mode is bootloader only after checking that firmware !== none (condition above)
        // because device without firmware always reports that it is in bootloader mode.
        //
        // We want to prevent FW installation directly from bootloader only during onboarding,
        // because we want to read current FW version from the device first and cache it.
        // But for standalone FW update we need to allow bootloader mode directly, because
        // the device could be stucked in bootloader (e.g. wrong intermediary FW installation).
        return <PrerequisitesGuide />;
    } else if (device.firmware === 'required' || device.firmware === 'outdated') {
        content = {
            heading: switchFirmwareType ? (
                <Translation
                    id="TR_SWITCH_FIRMWARE_TO"
                    values={{
                        firmwareType: (
                            <Translation
                                id={
                                    targetType === FirmwareType.BitcoinOnly
                                        ? 'TR_FIRMWARE_TYPE_BITCOIN_ONLY'
                                        : 'TR_FIRMWARE_TYPE_REGULAR'
                                }
                            />
                        ),
                    }}
                />
            ) : (
                <Translation id="TR_INSTALL_FIRMWARE" />
            ),
            description: (
                <Translation
                    id={getDescription({
                        /**
                         * `device.firmware` is status of the firmware currently installed on the device.
                         *  available values: 'valid' | 'outdated' | 'required' | 'unknown' | 'none'
                         *
                         *  `device.firmwareReleaseConfigInfo` on the other hand contains latest available firmware to update to
                         *   (it is whatever returns getInfo() method from connect)
                         *   so it should not be used here.
                         */
                        required: device.firmware === 'required',
                        targetType,
                        switchFirmwareType,
                        isBitcoinOnlyAvailable,
                    })}
                    values={{
                        bitcoinOnly: <Translation id="TR_FIRMWARE_TYPE_BITCOIN_ONLY" />,
                        regular: <Translation id="TR_FIRMWARE_TYPE_REGULAR" />,
                    }}
                />
            ),
            innerActions: (
                <Row gap={16}>
                    <InstallButton
                        onClick={() =>
                            shouldCheckSeed ? setStatus('check-seed') : installFirmware(targetType)
                        }
                        isDisabled={multipleDevicesConnected}
                    >
                        <Translation id={deviceWillBeWiped ? 'TR_CONTINUE' : 'TR_INSTALL'} />
                    </InstallButton>
                    {deviceWillBeWiped && onClose && (
                        <OnboardingCard.Button
                            onClick={onClose}
                            intent="neutral"
                            priority="secondary"
                        >
                            <Translation id="TR_CLOSE" />
                        </OnboardingCard.Button>
                    )}
                </Row>
            ),
            outerActions:
                device.firmware === 'outdated' && !isFirmwareInstallationMandatory ? (
                    <OnboardingCard.SecondaryButton
                        onClick={() => {
                            setShowSkipConfirmation(true);
                            updateAnalytics({ firmware: 'skip' });
                        }}
                        data-testid="@firmware/skip-button"
                    >
                        <Translation id="TR_SKIP_UPDATE" />
                    </OnboardingCard.SecondaryButton>
                ) : undefined,
        };
    }

    if (content) {
        return (
            <>
                {showSkipConfirmation && (
                    <SkipStepConfirmation onCancel={() => setShowSkipConfirmation(false)} />
                )}
                <OnboardingCard
                    iconName="circuitry"
                    heading={content.heading}
                    description={content.description}
                    innerActions={content.innerActions}
                    outerActions={content.outerActions}
                    isActionAbortable={false}
                >
                    <Column gap={32}>
                        {deviceWillBeWiped && <FirmwareWipeWarning />}
                        <Card>
                            <FirmwareOffer targetFirmwareType={targetType} />
                        </Card>
                        <FirmwareWarningsList />
                    </Column>
                </OnboardingCard>
            </>
        );
    }

    return null;
};
