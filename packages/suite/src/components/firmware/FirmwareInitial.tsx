import { useEffect, useState, Dispatch, SetStateAction } from 'react';

import styled from 'styled-components';

import { getFwUpdateVersion } from '@suite-common/suite-utils';
import { Note } from '@trezor/components';
import { AcquiredDevice, TrezorDevice } from '@suite-common/suite-types';
import {
    getFirmwareVersion,
    hasBitcoinOnlyFirmware,
    isBitcoinOnlyDevice,
} from '@trezor/device-utils';
import { FirmwareType } from '@trezor/connect';
import { selectDevices } from '@suite-common/wallet-core';

import {
    ConnectDevicePromptManager,
    OnboardingStepBox,
    OnboardingButtonSkip,
} from 'src/components/onboarding';
import { Translation } from '../suite';
import { useDevice, useFirmware, useOnboarding, useSelector } from 'src/hooks/suite';
import {
    ReconnectDevicePrompt,
    FirmwareInstallButton,
    FirmwareOffer,
} from 'src/components/firmware';

const Description = styled.div`
    align-items: center;
    display: flex;
    flex-direction: column;
    gap: 16px;
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

const StyledConnectDevicePrompt = styled(ConnectDevicePromptManager)`
    margin-top: 120px;
`;

interface FirmwareInitialProps {
    cachedDevice?: TrezorDevice;
    setCachedDevice: Dispatch<SetStateAction<TrezorDevice | undefined>>;
    // This component is shared between Onboarding flow and standalone fw update modal with few minor UI changes
    // If it is set to true, then you know it is being rendered in standalone fw update modal
    standaloneFwUpdate?: boolean;
    onInstall: (firmwareType?: FirmwareType) => void;
    shouldSwitchFirmwareType?: boolean;
    onClose?: () => void;
}

interface GetDescriptionProps {
    required: boolean;
    standaloneFwUpdate: boolean;
    reinstall: boolean;
    shouldSwitchFirmwareType?: boolean;
    isBitcoinOnlyAvailable?: boolean;
}

const getDescription = ({
    required,
    standaloneFwUpdate,
    reinstall,
    shouldSwitchFirmwareType,
    isBitcoinOnlyAvailable,
}: GetDescriptionProps) => {
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

export const FirmwareInitial = ({
    cachedDevice,
    setCachedDevice,
    onInstall,
    standaloneFwUpdate = false,
    shouldSwitchFirmwareType,
    onClose,
}: FirmwareInitialProps) => {
    const [bitcoinOnlyOffer, setBitcoinOnlyOffer] = useState(false);
    const { device: liveDevice } = useDevice();
    const { setStatus, status } = useFirmware();
    const { goToNextStep, updateAnalytics } = useOnboarding();
    const devices = useSelector(selectDevices);

    // todo: move to utils device.ts
    const devicesConnected = devices.filter(device => device?.connected);
    const multipleDevicesConnected = [...new Set(devicesConnected.map(d => d.path))].length > 1;

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
        return <StyledConnectDevicePrompt device={device} />;
    }

    // Bitcoin-only firmware is only available on T2T1 from v2.0.8 - older devices must first upgrade to 2.1.1 which does not have a Bitcoin-only variant
    const isBitcoinOnlyAvailable = !!device.firmwareRelease?.release.url_bitcoinonly;
    const currentFwVersion = getFirmwareVersion(device);
    const availableFwVersion = getFwUpdateVersion(device);
    const hasLatestAvailableFw = !!(
        availableFwVersion &&
        currentFwVersion &&
        availableFwVersion === currentFwVersion
    );
    const isCurrentlyBitcoinOnly = hasBitcoinOnlyFirmware(device);
    const targetFirmwareType =
        // updating Bitcoin-only
        (isCurrentlyBitcoinOnly && !shouldSwitchFirmwareType) ||
        // switching to Bitcoin-only
        (!isCurrentlyBitcoinOnly && shouldSwitchFirmwareType && isBitcoinOnlyAvailable) ||
        // Bitcoin-only device
        isBitcoinOnlyDevice(device)
            ? FirmwareType.BitcoinOnly
            : FirmwareType.Regular;

    const installFirmware = (type: FirmwareType) => {
        onInstall(type);
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
            body: cachedDevice?.firmwareRelease ? (
                <FirmwareOffer
                    device={cachedDevice}
                    targetFirmwareType={FirmwareType.BitcoinOnly}
                />
            ) : undefined,
            innerActions: (
                <ButtonRow>
                    <FirmwareInstallButton
                        variant="secondary"
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
                        onClick={() => installFirmware(FirmwareType.BitcoinOnly)}
                        multipleDevicesConnected={multipleDevicesConnected}
                    >
                        <Translation
                            id="TR_INSTALL_BITCOIN_ONLY"
                            values={{
                                bitcoinOnly: <Translation id="TR_FIRMWARE_TYPE_BITCOIN_ONLY" />,
                            }}
                        />
                    </FirmwareInstallButton>
                </ButtonRow>
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
            body: cachedDevice?.firmwareRelease ? (
                <FirmwareOffer device={cachedDevice} targetFirmwareType={targetFirmwareType} />
            ) : undefined,
            innerActions: (
                <FirmwareInstallButton
                    onClick={() => installFirmware(targetFirmwareType)}
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
                    values={{
                        bitcoinOnly: <Translation id="TR_FIRMWARE_TYPE_BITCOIN_ONLY" />,
                        regular: <Translation id="TR_FIRMWARE_TYPE_REGULAR" />,
                    }}
                />
            ),
            body: <FirmwareOffer device={device} targetFirmwareType={targetFirmwareType} />,
            innerActions: (
                <FirmwareInstallButton
                    onClick={() => {
                        setStatus(standaloneFwUpdate ? 'check-seed' : 'waiting-for-bootloader');
                        updateAnalytics({ firmware: 'update' });
                    }}
                    multipleDevicesConnected={multipleDevicesConnected}
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
                        onClose={onClose}
                    />
                )}

                <OnboardingStepBox
                    image="FIRMWARE"
                    heading={content.heading}
                    description={content.description}
                    innerActions={content.innerActions}
                    outerActions={content.outerActions}
                    disableConfirmWrapper={!!standaloneFwUpdate}
                    device={status === 'waiting-for-confirmation' ? device : undefined}
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
