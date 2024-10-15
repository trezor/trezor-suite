import { useState } from 'react';
import styled from 'styled-components';

import { ExtendedMessageDescriptor } from '@suite-common/intl-types';
import { getFwUpdateVersion } from '@suite-common/suite-utils';
import { Note, variables } from '@trezor/components';
import { AcquiredDevice } from '@suite-common/suite-types';
import { getFirmwareVersion, isBitcoinOnlyDevice } from '@trezor/device-utils';
import { FirmwareType } from '@trezor/connect';
import { selectDevices } from '@suite-common/wallet-core';

import { OnboardingStepBox, OnboardingButtonSkip } from 'src/components/onboarding';
import { PrerequisitesGuide, Translation } from '../suite';
import { useDevice, useFirmware, useOnboarding, useSelector } from 'src/hooks/suite';
import { FirmwareInstallButton, FirmwareOffer } from 'src/components/firmware';
import { FirmwareButtonsRow } from './Buttons/FirmwareButtonsRow';
import { FirmwareSwitchWarning } from './FirmwareSwitchWarning';
import { spacingsPx } from '@trezor/theme';

const Description = styled.div`
    align-items: center;
    display: flex;
    flex-direction: column;
    gap: 16px;
`;

const TextButton = styled.button`
    background: none;
    border: none;
    cursor: pointer;
    font-size: inherit;
    padding: 0;
    text-decoration: underline;
`;

const WarningListWrapper = styled.div`
    display: flex;
    align-items: flex-start;
    flex-direction: column;
    gap: ${spacingsPx.md};
    border-bottom: 1px solid ${({ theme }) => theme.legacy.STROKE_GREY};
    margin: ${spacingsPx.xs} ${spacingsPx.md};
    padding-bottom: ${spacingsPx.md};
`;

const Important = styled.div`
    align-self: flex-start;
    color: ${({ theme }) => theme.legacy.TYPE_LIGHT_GREY};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    text-transform: uppercase;
`;

const EmphasizedText = styled.b`
    color: ${({ theme }) => theme.legacy.TYPE_DARK_GREY};
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
`;

interface GetDescriptionProps {
    required: boolean;
    standaloneFwUpdate: boolean;
    reinstall: boolean;
    targetType: FirmwareType;
    shouldSwitchFirmwareType?: boolean;
    isBitcoinOnlyAvailable?: boolean;
}

const getDescription = ({
    required,
    standaloneFwUpdate,
    reinstall,
    targetType,
    shouldSwitchFirmwareType,
    isBitcoinOnlyAvailable,
}: GetDescriptionProps) => {
    if (shouldSwitchFirmwareType) {
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

    if (standaloneFwUpdate) {
        return reinstall
            ? 'TR_FIRMWARE_REINSTALL_FW_DESCRIPTION'
            : 'TR_FIRMWARE_NEW_FW_DESCRIPTION';
    }

    return 'TR_ONBOARDING_NEW_FW_DESCRIPTION';
};

const getNoFirmwareInstalledSubheading = (device: AcquiredDevice) => {
    const bitcoinOnlyDevice = isBitcoinOnlyDevice(device);

    if (bitcoinOnlyDevice) {
        return device.firmware === 'none'
            ? 'TR_FIRMWARE_SUBHEADING_NONE_BITCOIN_ONLY_DEVICE'
            : 'TR_FIRMWARE_SUBHEADING_UNKNOWN_BITCOIN_ONLY_DEVICE';
    }

    return device.firmware === 'none'
        ? 'TR_FIRMWARE_SUBHEADING_NONE'
        : 'TR_FIRMWARE_SUBHEADING_UNKNOWN';
};

interface FirmwareInitialProps {
    shouldSwitchFirmwareType?: boolean;
    // This component is shared between Onboarding flow and standalone fw update modal with few minor UI changes
    // If it is set to true, then you know it is being rendered in standalone fw update modal
    standaloneFwUpdate?: boolean;
    onClose?: () => void;
}

export const FirmwareInitial = ({
    shouldSwitchFirmwareType = false,
    standaloneFwUpdate = false,
    onClose,
}: FirmwareInitialProps) => {
    const [bitcoinOnlyOffer, setBitcoinOnlyOffer] = useState(false);
    const { device } = useDevice();
    const { deviceWillBeWiped, firmwareUpdate, setStatus, targetFirmwareType } = useFirmware({
        shouldSwitchFirmwareType,
    });
    const { goToNextStep, updateAnalytics } = useOnboarding();
    const devices = useSelector(selectDevices);

    // Just to satisfy TS, disconnected device should be handled upstream.
    if (!device?.connected || !device?.features) {
        return null;
    }

    // todo: move to utils device.ts
    const devicesConnected = devices.filter(device => device?.connected);
    const multipleDevicesConnected = [...new Set(devicesConnected.map(d => d.path))].length > 1;
    const shouldCheckSeed = device?.mode !== 'initialize';

    let content;

    const targetType = bitcoinOnlyOffer ? FirmwareType.BitcoinOnly : targetFirmwareType;
    // Bitcoin-only firmware is only available on T2T1 from v2.0.8 - older devices must first upgrade to 2.1.1 which does not have a Bitcoin-only variant
    const isBitcoinOnlyAvailable = !!device.firmwareRelease?.release.url_bitcoinonly;
    const currentFwVersion = getFirmwareVersion(device);
    const availableFwVersion = getFwUpdateVersion(device);
    const hasLatestAvailableFw = !!(
        availableFwVersion &&
        currentFwVersion &&
        availableFwVersion === currentFwVersion
    );

    const installFirmware = (firmwareType: FirmwareType) => {
        firmwareUpdate({ firmwareType });
        updateAnalytics({ firmware: 'install' });
    };

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
                <Description>
                    <Translation id="TR_FIRMWARE_SUBHEADING_BITCOIN" />
                    <Note>
                        <Translation id="TR_CHANGE_FIRMWARE_TYPE_ANYTIME" />
                    </Note>
                </Description>
            ),
            body: <FirmwareOffer targetFirmwareType={FirmwareType.BitcoinOnly} />,
            innerActions: (
                <FirmwareButtonsRow>
                    <FirmwareInstallButton
                        variant="tertiary"
                        onClick={() => installFirmware(FirmwareType.Regular)}
                        multipleDevicesConnected={multipleDevicesConnected}
                    >
                        <Translation
                            id="TR_INSTALL_REGULAR"
                            values={{
                                regular: <Translation id="TR_FIRMWARE_TYPE_REGULAR" />,
                            }}
                        />
                    </FirmwareInstallButton>

                    <FirmwareInstallButton
                        onClick={() => installFirmware(targetType)}
                        multipleDevicesConnected={multipleDevicesConnected}
                    >
                        <Translation
                            id="TR_INSTALL_BITCOIN_ONLY"
                            values={{
                                bitcoinOnly: <Translation id="TR_FIRMWARE_TYPE_BITCOIN_ONLY" />,
                            }}
                        />
                    </FirmwareInstallButton>
                </FirmwareButtonsRow>
            ),
        };
    } else if (['none', 'unknown'].includes(device.firmware)) {
        const subheadingId = getNoFirmwareInstalledSubheading(device);

        // No firmware installed
        // Device without firmware is already in bootloader mode even if it doesn't report it
        content = {
            heading: <Translation id="TR_INSTALL_FIRMWARE" />,
            description: (
                <Translation
                    id={subheadingId}
                    values={{
                        i: chunks => <i>{chunks}</i>,
                        button: chunks => (
                            <TextButton onClick={() => setBitcoinOnlyOffer(true)}>
                                {chunks}
                            </TextButton>
                        ),
                        bitcoinOnly: <Translation id="TR_FIRMWARE_TYPE_BITCOIN_ONLY" />,
                    }}
                />
            ),
            body: <FirmwareOffer targetFirmwareType={targetType} />,
            innerActions: (
                <FirmwareInstallButton
                    onClick={() => installFirmware(targetType)}
                    multipleDevicesConnected={multipleDevicesConnected}
                />
            ),
        };
    } else if (device.mode === 'bootloader' && !standaloneFwUpdate) {
        // We can check if device.mode is bootloader only after checking that firmware !== none (condition above)
        // because device without firmware always reports that it is in bootloader mode.
        //
        // We want to prevent FW installation directly from bootloader only during onboarding,
        // because we want to read current FW version from the device first and cache it.
        // But for standalone FW update we need to allow bootloader mode directly, because
        // the device could be stucked in bootloader (e.g. wrong intermediary FW installation).
        return <PrerequisitesGuide />;
    } else if (
        device.firmware === 'required' ||
        device.firmware === 'outdated' ||
        standaloneFwUpdate
    ) {
        const warningTranslationValues: ExtendedMessageDescriptor['values'] = {
            b: chunks => <EmphasizedText>{chunks}</EmphasizedText>,
        };

        content = {
            heading: shouldSwitchFirmwareType ? (
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
                         *  `device.firmwareRelease` on the other hand contains latest available firmware to update to
                         *   (it is whatever returns getInfo() method from connect)
                         *   so it should not be used here.
                         */
                        required: device.firmware === 'required',
                        standaloneFwUpdate,
                        reinstall: device.firmware === 'valid' || hasLatestAvailableFw,
                        targetType,
                        shouldSwitchFirmwareType,
                        isBitcoinOnlyAvailable,
                    })}
                    values={{
                        bitcoinOnly: <Translation id="TR_FIRMWARE_TYPE_BITCOIN_ONLY" />,
                        regular: <Translation id="TR_FIRMWARE_TYPE_REGULAR" />,
                    }}
                />
            ),
            body: (
                <>
                    {deviceWillBeWiped && (
                        <WarningListWrapper>
                            <Important>
                                <Translation id="TR_IMPORTANT" />
                            </Important>
                            <FirmwareSwitchWarning>
                                <Translation
                                    id="TR_FIRMWARE_SWITCH_WARNING_1"
                                    values={warningTranslationValues}
                                />
                            </FirmwareSwitchWarning>
                            <FirmwareSwitchWarning>
                                <Translation
                                    id="TR_FIRMWARE_SWITCH_WARNING_2"
                                    values={warningTranslationValues}
                                />
                            </FirmwareSwitchWarning>
                        </WarningListWrapper>
                    )}
                    <FirmwareOffer targetFirmwareType={targetType} />
                </>
            ),
            innerActions: (
                <FirmwareButtonsRow withCancelButton={deviceWillBeWiped} onClose={onClose}>
                    <FirmwareInstallButton
                        onClick={() =>
                            shouldCheckSeed ? setStatus('check-seed') : installFirmware(targetType)
                        }
                        multipleDevicesConnected={multipleDevicesConnected}
                    >
                        <Translation id={deviceWillBeWiped ? 'TR_CONTINUE' : 'TR_INSTALL'} />
                    </FirmwareInstallButton>
                </FirmwareButtonsRow>
            ),
            outerActions:
                device.firmware === 'outdated' && !standaloneFwUpdate ? (
                    // Fw update is not mandatory, show skip button
                    <OnboardingButtonSkip
                        onClick={() => {
                            goToNextStep();
                            updateAnalytics({ firmware: 'skip' });
                        }}
                        data-testid="@firmware/skip-button"
                    >
                        <Translation id="TR_SKIP_UPDATE" />
                    </OnboardingButtonSkip>
                ) : undefined,
        };
    }

    if (content) {
        return (
            <>
                <OnboardingStepBox
                    image="FIRMWARE"
                    heading={content.heading}
                    description={content.description}
                    innerActions={content.innerActions}
                    outerActions={content.outerActions}
                    disableConfirmWrapper={!!standaloneFwUpdate}
                    isActionAbortable={false}
                    nested={!!standaloneFwUpdate}
                >
                    {content.body}
                </OnboardingStepBox>
            </>
        );
    }

    return null;
};
