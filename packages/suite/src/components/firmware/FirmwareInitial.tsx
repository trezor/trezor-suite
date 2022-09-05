import React, { useEffect, useState } from 'react';
import styled from 'styled-components';

import { useTheme, Icon } from '@trezor/components';
import {
    ConnectDevicePromptManager,
    OnboardingStepBox,
    OnboardingButtonSkip,
} from '@onboarding-components';
import { Translation } from '@suite-components';
import { useDevice, useFirmware, useOnboarding, useSelector } from '@suite-hooks';
import { ReconnectDevicePrompt, InstallButton, FirmwareOffer } from '@firmware-components';
import { FirmwareType, TrezorDevice } from '@suite-types';
import { getFwVersion, getFwUpdateVersion, getPhysicalDeviceCount } from '@suite-utils/device';

const InfoRow = styled.div`
    align-items: center;
    display: flex;
    font-weight: 600;
    gap: 4px;
    margin: 8px auto 0 auto;
    max-width: max-content;
`;

const ButtonRow = styled.div`
    display: flex;
    gap: 20px;
`;

const TextButton = styled.button`
    background: none;
    border: none;
    cursor: pointer;
    font-size: inherit;
    padding: 0;
    text-decoration: underline;
`;

interface FirmwareInitialProps {
    cachedDevice?: TrezorDevice;
    setCachedDevice: React.Dispatch<React.SetStateAction<TrezorDevice | undefined>>;
    // This component is shared between Onboarding flow and standalone fw update modal with few minor UI changes
    // If it is set to true, then you know it is being rendered in standalone fw update modal
    standaloneFwUpdate?: boolean;
    onInstall: (firmwareType?: FirmwareType) => void;
    shouldSwitchFirmwareType?: boolean;
}

const getDescription = ({
    required,
    standaloneFwUpdate,
    reinstall,
    shouldSwitchFirmwareType,
    isBitcoinOnlyAvailable,
}: {
    required: boolean;
    standaloneFwUpdate: boolean;
    reinstall: boolean;
    shouldSwitchFirmwareType?: boolean;
    isBitcoinOnlyAvailable?: boolean;
}) => {
    if (shouldSwitchFirmwareType) {
        return isBitcoinOnlyAvailable
            ? 'TR_SWITCH_FIRMWARE_TYPE_DESCRIPTION'
            : 'TR_BITCOIN_ONLY_UNAVAILABLE';
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

export const FirmwareInitial = ({
    cachedDevice,
    setCachedDevice,
    onInstall,
    standaloneFwUpdate = false,
    shouldSwitchFirmwareType,
}: FirmwareInitialProps) => {
    const [bitcoinOnlyOffer, setBitcoinOnlyOffer] = useState(false);
    const { device: liveDevice } = useDevice();
    const { setStatus, status } = useFirmware();
    const { goToNextStep, updateAnalytics } = useOnboarding();
    const theme = useTheme();
    const devices = useSelector(state => state.devices);
    const physicalDeviceCount = getPhysicalDeviceCount(devices);

    useEffect(() => {
        // When the user choses to install a new firmware update we will ask him/her to reconnect a device in bootloader mode.
        // This prompt (to reconnect a device in bootloader mode) is shown in modal which is visually layer above the content.
        // We are caching the device in order to preserve the background content (screen with fw update offer) when the user
        // disconnects the device and reconnects it in bl mode.
        // (Device in BL mode doesn't provide us all the details and we don't want any flickering or reacting in general while the user is just following our instructions)
        if (liveDevice?.connected && liveDevice?.mode !== 'bootloader' && liveDevice.features) {
            // we never store state of the device while it is in bootloader, we want just "normal" mode
            setCachedDevice(liveDevice);
        }
    }, [cachedDevice?.id, liveDevice, setCachedDevice]);

    // User is following instructions for disconnecting/reconnecting a device in bootloader mode; We'll use cached version of the device
    const device = status === 'waiting-for-bootloader' ? cachedDevice : liveDevice;

    let content;

    if (!device?.connected || !device?.features) {
        // Most users won't see this as they should come here with a connected device.
        // This is just for people who want to shoot themselves in the foot and disconnect the device before proceeding with fw update flow
        // Be aware that disconnection after fw installation () is completed is fine and won't be caught by this, because device variable will point to cached device
        return <ConnectDevicePromptManager device={device} />;
    }

    // Bitcoin-only firmware is only available on T2 from v2.0.8 - older devices must first upgrade to 2.1.1 which does not have a Bitcoin-only variant
    const isBitcoinOnlyAvailable = !!device.firmwareRelease?.release.url_bitcoinonly;
    const currentFwVersion = getFwVersion(device);
    const availableFwVersion = getFwUpdateVersion(device);
    const hasLatestAvailableFw = !!(
        availableFwVersion &&
        currentFwVersion &&
        availableFwVersion === currentFwVersion
    );
    const isCurrentlyBitcoinOnly = device.firmwareType === 'bitcoin-only';
    const targetFirmwareType =
        // switching to Universal
        (isCurrentlyBitcoinOnly && shouldSwitchFirmwareType) ||
        // updating Universal
        (!isCurrentlyBitcoinOnly && !shouldSwitchFirmwareType) ||
        // attempting to switch to Bitcoin-only from old firmware
        (!isCurrentlyBitcoinOnly && shouldSwitchFirmwareType && !isBitcoinOnlyAvailable)
            ? FirmwareType.Universal
            : FirmwareType.BitcoinOnly;

    const installFirmware = (type: FirmwareType) => {
        onInstall(type);
        updateAnalytics({ firmware: 'install' });
    };

    if (bitcoinOnlyOffer) {
        // Installing Bitcoin-only firmware in onboarding
        content = {
            heading: <Translation id="TR_INSTALL_BITCOIN_FW" />,
            description: (
                <>
                    <Translation id="TR_FIRMWARE_SUBHEADING_BITCOIN" />
                    <InfoRow>
                        <Icon size={12} color={theme.TYPE_LIGHT_GREY} icon="INFO" />
                        <Translation id="TR_CHANGE_FIRMWARE_TYPE_ANYTIME" />
                    </InfoRow>
                </>
            ),
            body: cachedDevice?.firmwareRelease ? (
                <FirmwareOffer device={cachedDevice} />
            ) : undefined,
            innerActions: (
                <ButtonRow>
                    <InstallButton
                        variant="secondary"
                        onClick={() => installFirmware(FirmwareType.Universal)}
                        multipleDevicesConnected={physicalDeviceCount > 1}
                    >
                        <Translation id="TR_INSTALL_UNIVERSAL" />
                    </InstallButton>

                    <InstallButton
                        onClick={() => installFirmware(FirmwareType.BitcoinOnly)}
                        multipleDevicesConnected={physicalDeviceCount > 1}
                    >
                        <Translation id="TR_INSTALL_BITCOIN_ONLY" />
                    </InstallButton>
                </ButtonRow>
            ),
        };
    } else if (['none', 'unknown'].includes(device.firmware)) {
        // No firmware installed
        // Device without firmware is already in bootloader mode even if it doesn't report it
        content = {
            heading: <Translation id="TR_INSTALL_FIRMWARE" />,
            description: (
                <Translation
                    id={
                        device.firmware === 'none'
                            ? 'TR_FIRMWARE_SUBHEADING_NONE'
                            : 'TR_FIRMWARE_SUBHEADING_UNKNOWN'
                    }
                    values={{
                        i: chunks => <i>{chunks}</i>,
                        button: chunks => (
                            <TextButton onClick={() => setBitcoinOnlyOffer(true)}>
                                {chunks}
                            </TextButton>
                        ),
                    }}
                />
            ),
            body: cachedDevice?.firmwareRelease ? (
                <FirmwareOffer device={cachedDevice} />
            ) : undefined,
            innerActions: (
                <InstallButton
                    onClick={() => installFirmware(FirmwareType.Universal)}
                    multipleDevicesConnected={physicalDeviceCount > 1}
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
        return <ConnectDevicePromptManager device={device} />;
    } else if (
        device.firmware === 'required' ||
        device.firmware === 'outdated' ||
        standaloneFwUpdate
    ) {
        content = {
            heading: <Translation id="TR_INSTALL_FIRMWARE" />,
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
                        shouldSwitchFirmwareType,
                        isBitcoinOnlyAvailable,
                    })}
                />
            ),
            body: <FirmwareOffer device={device} targetFirmwareType={targetFirmwareType} />,
            innerActions: (
                <InstallButton
                    onClick={() => {
                        setStatus(standaloneFwUpdate ? 'check-seed' : 'waiting-for-bootloader');
                        updateAnalytics({ firmware: 'update' });
                    }}
                    data-test="@firmware/get-ready-button"
                    multipleDevicesConnected={physicalDeviceCount > 1}
                />
            ),
            outerActions:
                device.firmware === 'outdated' && !standaloneFwUpdate ? (
                    // Fw update is not mandatory, show skip button
                    <OnboardingButtonSkip
                        onClick={() => {
                            goToNextStep();
                            updateAnalytics({ firmware: 'skip' });
                        }}
                        data-test="@firmware/skip-button"
                    >
                        <Translation id="TR_SKIP_UPDATE" />
                    </OnboardingButtonSkip>
                ) : undefined,
        };
    }

    // device.firmware === 'valid' is handled in in NoNewFirmware

    if (content) {
        return (
            <>
                {/* Modal above a fw update offer. Instructs user to reconnect the device in bootloader */}
                {status === 'waiting-for-bootloader' && (
                    <ReconnectDevicePrompt
                        expectedDevice={device}
                        requestedMode="bootloader"
                        onSuccess={() => onInstall(targetFirmwareType)}
                    />
                )}

                <OnboardingStepBox
                    image="FIRMWARE"
                    heading={content.heading}
                    description={content.description}
                    innerActions={content.innerActions}
                    outerActions={content.outerActions}
                    disableConfirmWrapper={!!standaloneFwUpdate}
                    confirmOnDevice={
                        status === 'waiting-for-confirmation'
                            ? device?.features?.major_version
                            : undefined
                    }
                    nested={!!standaloneFwUpdate}
                >
                    {content.body}
                </OnboardingStepBox>
            </>
        );
    }
    return null;
};
