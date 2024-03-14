import styled from 'styled-components';

import { acquireDevice, selectDevice } from '@suite-common/wallet-core';
import { ConfirmOnDevice, variables } from '@trezor/components';

import { closeModalApp } from 'src/actions/suite/routerActions';
import {
    CheckSeedStep,
    FirmwareCloseButton,
    FirmwareInitial,
    FirmwareInstallation,
    ReconnectDevicePrompt,
} from 'src/components/firmware';
import { Translation, Modal } from 'src/components/suite';
import { OnboardingStepBox } from 'src/components/onboarding';
import { useDispatch, useFirmware, useSelector } from 'src/hooks/suite';
import { DEVICE, DeviceModelInternal, UI } from '@trezor/connect';

const Wrapper = styled.div<{ $isWithTopPadding: boolean }>`
    display: flex;
    width: 100%;
    height: 100%;
    flex-direction: column;
    align-items: center;
    text-align: left;
    position: relative;

    ${variables.SCREEN_QUERY.ABOVE_TABLET} {
        padding-top: ${({ $isWithTopPadding }) => $isWithTopPadding && '44px'};
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
    const {
        resetReducer,
        status,
        error,
        firmwareUpdate,
        firmwareHashInvalid,
        getTargetFirmwareType,
        uiEvent,
    } = useFirmware();
    const device = useSelector(selectDevice);
    const dispatch = useDispatch();

    const deviceModelInternal = uiEvent?.payload.device.features?.internal_model;
    // Device will be wiped because Universal and Bitcoin-only firmware have different vendor headers on T2B1 or later devices.
    const deviceWillBeWiped =
        shouldSwitchFirmwareType && deviceModelInternal === DeviceModelInternal.T2B1;
    const confirmOnDevice =
        (uiEvent?.type === UI.FIRMWARE_RECONNECT && uiEvent.payload.bootloader) ||
        (uiEvent?.type === DEVICE.BUTTON &&
            uiEvent.payload.code === 'ButtonRequest_FirmwareUpdate');
    const showConfirmationPill =
        uiEvent &&
        !(uiEvent.type === UI.FIRMWARE_PROGRESS && uiEvent.payload.operation === 'downloading') &&
        !(uiEvent.type === DEVICE.BUTTON && uiEvent.payload.code === 'ButtonRequest_Other');
    const showReconnectPrompt =
        (uiEvent?.type === DEVICE.BUTTON && uiEvent.payload.code === 'ButtonRequest_Other') ||
        (uiEvent?.type === UI.FIRMWARE_DISCONNECT && uiEvent.payload.manual) ||
        (uiEvent?.type === UI.FIRMWARE_RECONNECT && uiEvent.payload.manual) ||
        (device?.mode === 'bootloader' &&
            status === 'error' &&
            error === 'Firmware install cancelled' &&
            uiEvent?.type === DEVICE.BUTTON &&
            uiEvent.payload.code === 'ButtonRequest_FirmwareUpdate');

    console.log('IS RENDERED: ', showConfirmationPill);

    const onClose = () => {
        if (device?.status !== 'available') {
            dispatch(acquireDevice(device));
        }
        dispatch(closeModalApp());
        resetReducer();
    };

    const installTargetFirmware = () =>
        firmwareUpdate({
            firmwareType: getTargetFirmwareType(!!shouldSwitchFirmwareType),
        });

    // some of the application states can be reused here.
    // some don't make sense handling here as they are handled somewhere up the tree
    // some must be handled in lower layers because of specifics of fw update process (eg. device-disconnected)
    const getSuiteApplicationState = () => {
        if (!device) return null;

        return null;
        // device features cannot be read, device is probably used in another window
        // if (device.type === 'unacquired') return DeviceAcquire;
        // Webusb unreadable device (HID)
        // if (device.type === 'unreadable') return DeviceUnreadable;
        // device features unknown (this shouldn't happened tho)
        // if (!device.features) return DeviceUnknown;
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
            case 'error':
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
            case 'initial':
                return (
                    <FirmwareInitial
                        standaloneFwUpdate
                        shouldSwitchFirmwareType={shouldSwitchFirmwareType}
                        willBeWiped={deviceWillBeWiped}
                        onInstall={installTargetFirmware}
                        onClose={onClose}
                    />
                );
            case 'check-seed': // triggered from FirmwareInitial
                return (
                    <CheckSeedStep
                        onSuccess={installTargetFirmware}
                        onClose={onClose}
                        willBeWiped={deviceWillBeWiped}
                    />
                );
            case 'started': // called from firmwareUpdate()
            case 'partially-done': // only relevant for T1B1, updating from very old fw is done in 2 fw updates, partially-done means first update was installed
            case 'done':
                return (
                    <FirmwareInstallation
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
                showConfirmationPill && (
                    <ConfirmOnDevice
                        title={<Translation id="TR_CONFIRM_ON_TREZOR" />}
                        deviceModelInternal={deviceModelInternal}
                        deviceUnitColor={uiEvent?.payload.device.features?.unit_color}
                        isConfirmed={!confirmOnDevice}
                    />
                )
            }
            onCancel={onClose}
            data-test="@firmware"
            heading={<Translation id={heading} />}
        >
            {/* <div>status: {status}</div> */}
            {showReconnectPrompt && (
                <ReconnectDevicePrompt
                    requestedMode="bootloader"
                    onClose={onClose}
                    onSuccess={installTargetFirmware}
                />
            )}
            {/* <div>
                event:
                {(() => {
                    if (!uiEvent) return '';
                    if (uiEvent.type === 'ui-firmware_reconnect') {
                        const { manual, bootloader, confirmOnDevice } = uiEvent.payload;

                        return ` reconnect your device ${manual ? 'manually' : 'automagically'}  in ${bootloader ? 'bootloader' : 'normal'} mode. ${confirmOnDevice && 'action on device needed'}`;
                    }
                    if (uiEvent.type === 'ui-firmware_disconnect') {
                        const { manual } = uiEvent.payload;

                        return ` disconnect your device ${manual ? 'manually' : 'automagically'}`;
                    }
                    if (uiEvent.type === 'ui-firmware-progress') {
                        const { operation, progress } = uiEvent.payload;

                        return ` ${operation} ${progress}`;
                    }
                    if (uiEvent.type === 'button') {
                        return 'button request: ' + uiEvent.payload.code;
                    }

                    return 'unknonw';
                })()}
            </div> */}

            <Wrapper $isWithTopPadding={!isCancelable}>{Component}</Wrapper>
        </StyledModal>
    );
};
