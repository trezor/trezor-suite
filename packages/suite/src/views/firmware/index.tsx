import { useState } from 'react';

import styled from 'styled-components';

import { acquireDevice, selectDevice } from '@suite-common/wallet-core';
import { ConfirmOnDevice, variables } from '@trezor/components';

import { closeModalApp } from 'src/actions/suite/routerActions';
import { TrezorDevice } from 'src/types/suite';
import {
    CheckSeedStep,
    FirmwareCloseButton,
    FirmwareInitial,
    FirmwareInstallation,
} from 'src/components/firmware';
import { DeviceAcquire } from 'src/views/suite/device-acquire';
import { DeviceUnknown } from 'src/views/suite/device-unknown';
import { DeviceUnreadable } from 'src/views/suite/device-unreadable';
import { Translation, Modal } from 'src/components/suite';
import { OnboardingStepBox } from 'src/components/onboarding';
import { useDispatch, useFirmware, useSelector } from 'src/hooks/suite';
import { DeviceModelInternal } from '@trezor/connect';

const Wrapper = styled.div<{ isWithTopPadding: boolean }>`
    display: flex;
    width: 100%;
    height: 100%;
    flex-direction: column;
    align-items: center;
    text-align: left;
    position: relative;

    ${variables.SCREEN_QUERY.ABOVE_TABLET} {
        padding-top: ${({ isWithTopPadding }) => isWithTopPadding && '44px'};
    }
`;

const StyledModal = styled(Modal)`
    width: 620px;
    min-height: 540px;
`;

type FirmwareProps = {
    shouldSwitchFirmwareType?: boolean;
};

export const Firmware = ({ shouldSwitchFirmwareType }: FirmwareProps) => {
    const { resetReducer, status, setStatus, error, firmwareUpdate, firmwareHashInvalid } =
        useFirmware();
    const device = useSelector(selectDevice);
    const dispatch = useDispatch();

    const deviceModelInternal = device?.features?.internal_model;
    // Device will be wiped because Universal and Bitcoin-only firmware have different vendor headers on T2B1 or later devices.
    const deviceWillBeWiped =
        shouldSwitchFirmwareType && deviceModelInternal === DeviceModelInternal.T2B1;

    const onClose = () => {
        if (device?.status !== 'available') {
            dispatch(acquireDevice(device));
        }
        dispatch(closeModalApp());
        resetReducer();
    };

    const [cachedDevice, setCachedDevice] = useState<TrezorDevice | undefined>(device);

    // some of the application states can be reused here.
    // some don't make sense handling here as they are handled somewhere up the tree
    // some must be handled in lower layers because of specifics of fw update process (eg. device-disconnected)
    const getSuiteApplicationState = () => {
        if (!device) return;
        // device features cannot be read, device is probably used in another window
        if (device.type === 'unacquired') return DeviceAcquire;
        // Webusb unreadable device (HID)
        if (device.type === 'unreadable') return DeviceUnreadable;
        // device features unknown (this shouldn't happened tho)
        if (!device.features) return DeviceUnknown;
    };

    const getComponent = () => {
        // edge case 1 - error

        // special and hopefully very rare case. this appears when somebody tried to fool user into using a hacked firmware
        if (device?.id && firmwareHashInvalid.includes(device.id)) {
            return (
                <OnboardingStepBox
                    image="UNI_ERROR"
                    heading={<Translation id="TR_FIRMWARE_HASH_MISMATCH" />}
                    nested
                />
            );
        }

        switch (status) {
            case 'error': {
                return (
                    <OnboardingStepBox
                        image="FIRMWARE"
                        heading={<Translation id="TR_FW_INSTALLATION_FAILED" />}
                        description={
                            <Translation id="TOAST_GENERIC_ERROR" values={{ error: error || '' }} />
                        }
                        innerActions={<FirmwareCloseButton onClick={onClose} />}
                        nested
                    />
                );
            }
            case 'initial':
            case 'waiting-for-bootloader': // waiting for user to reconnect in bootloader
                return (
                    <FirmwareInitial
                        cachedDevice={cachedDevice}
                        setCachedDevice={setCachedDevice}
                        standaloneFwUpdate
                        shouldSwitchFirmwareType={shouldSwitchFirmwareType}
                        willBeWiped={deviceWillBeWiped}
                        onInstall={firmwareUpdate}
                        onClose={onClose}
                    />
                );
            case 'check-seed': // triggered from FirmwareInitial
                return (
                    <CheckSeedStep
                        onSuccess={() => setStatus('waiting-for-bootloader')}
                        onClose={onClose}
                        willBeWiped={deviceWillBeWiped}
                    />
                );
            case 'waiting-for-confirmation': // waiting for confirming installation on a device
            case 'started': // called from firmwareUpdate()
            case 'installing':
            case 'wait-for-reboot':
            case 'unplug': // only relevant for T1B1, T2T1 auto restarts itself
            case 'reconnect-in-normal': // only relevant for T1B1, T2T1 auto restarts itself
            case 'partially-done': // only relevant for T1B1, updating from very old fw is done in 2 fw updates, partially-done means first update was installed
            case 'validation':
            case 'done':
                return (
                    <FirmwareInstallation
                        cachedDevice={cachedDevice}
                        standaloneFwUpdate
                        onSuccess={onClose}
                        onClose={onClose}
                    />
                );
            default:
                // 'ensure' type completeness
                throw new Error(`state "${status}" is not handled here`);
        }
    };

    const Component = getComponent();

    if (!Component) return null;

    const ApplicationStateModal = getSuiteApplicationState();

    if (ApplicationStateModal) return <ApplicationStateModal />;

    const isCancelable = ['initial', 'check-seed', 'done', 'partially-done', 'error'].includes(
        status,
    );
    const heading = shouldSwitchFirmwareType ? 'TR_SWITCH_FIRMWARE' : 'TR_INSTALL_FIRMWARE';

    return (
        <StyledModal
            isCancelable={isCancelable}
            modalPrompt={
                status === 'waiting-for-confirmation' && (
                    <ConfirmOnDevice
                        title={<Translation id="TR_CONFIRM_ON_TREZOR" />}
                        deviceModelInternal={deviceModelInternal}
                        deviceUnitColor={device?.features?.unit_color}
                    />
                )
            }
            onCancel={onClose}
            data-test="@firmware"
            heading={<Translation id={heading} />}
        >
            <Wrapper isWithTopPadding={!isCancelable}>{Component}</Wrapper>
        </StyledModal>
    );
};
