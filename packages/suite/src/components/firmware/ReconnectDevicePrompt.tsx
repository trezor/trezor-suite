import * as semver from 'semver';
import styled from 'styled-components';
import { getFirmwareVersion } from '@trezor/device-utils';
import { H2, DeviceAnimation, NewModal, Paragraph, List } from '@trezor/components';
import { DEVICE, Device, DeviceModelInternal, UI } from '@trezor/connect';
import { Translation, WebUsbButton } from 'src/components/suite';
import { DeviceConfirmImage } from 'src/components/suite/DeviceConfirmImage';
import { useDevice, useFirmware, useSelector } from 'src/hooks/suite';
import { ConfirmOnDevice } from '@trezor/product-components';
import { TranslationKey } from '@suite-common/intl-types';
import { spacings } from '@trezor/theme';
import { selectDeviceLabelOrName } from '@suite-common/wallet-core';

const ImageWrapper = styled.div`
    display: flex;
    justify-content: center;
`;

const RebootDeviceGraphics = ({
    device,
    isManualRebootRequired,
}: {
    device?: Device;
    isManualRebootRequired: boolean;
}) => {
    if (!isManualRebootRequired) {
        return device ? <DeviceConfirmImage device={device} /> : null;
    }

    const deviceModelInternal = device?.features?.internal_model;

    const getRebootType = () => {
        // Used during intermediary update on T1B1.
        if (device?.mode === 'bootloader') {
            return 'NORMAL';
        }
        // T1B1 bootloader before firmware version 1.8.0 can only be invoked by holding both buttons.
        const deviceFwVersion = device?.features ? getFirmwareVersion(device) : '';
        if (
            deviceModelInternal === DeviceModelInternal.T1B1 &&
            semver.valid(deviceFwVersion) &&
            semver.satisfies(deviceFwVersion, '<1.8.0')
        ) {
            return 'BOOTLOADER_TWO_BUTTONS';
        }

        return 'BOOTLOADER';
    };

    return (
        <DeviceAnimation
            type={getRebootType()}
            height="220px"
            width="220px"
            deviceModelInternal={deviceModelInternal}
            loop
        />
    );
};

interface ReconnectDevicePromptProps {
    onClose?: () => void;
    onSuccess: () => void;
}

export const ReconnectDevicePrompt = ({ onClose, onSuccess }: ReconnectDevicePromptProps) => {
    const deviceLabel = useSelector(selectDeviceLabelOrName);
    const { showManualReconnectPrompt, isWebUSB, status, uiEvent } = useFirmware();
    const { device } = useDevice();

    const isManualRebootRequired =
        // Automatic reboot not supported:
        showManualReconnectPrompt ||
        // Automatic reboot cancelled or device disconnected:
        status === 'error';

    const getRebootPhase = () => {
        if (
            device?.mode === 'bootloader' &&
            uiEvent?.type === DEVICE.BUTTON &&
            isManualRebootRequired
        ) {
            return 'done';
        }
        const rebootToBootloaderNotSupported =
            uiEvent?.type === UI.FIRMWARE_RECONNECT && !uiEvent.payload.disconnected;
        const rebootToBootloaderCancelled = device?.connected && device?.mode !== 'bootloader';

        return rebootToBootloaderNotSupported || rebootToBootloaderCancelled
            ? 'waiting-for-reboot'
            : 'disconnected';
    };

    const rebootPhase = getRebootPhase();
    const isRebootDone = rebootPhase === 'done';
    const deviceModelInternal = device?.features?.internal_model;
    const isAbortable =
        onClose !== undefined && isManualRebootRequired && rebootPhase == 'waiting-for-reboot';
    const showWebUsbButton = rebootPhase === 'disconnected' && isWebUSB;

    const toNormal =
        uiEvent?.type === UI.FIRMWARE_RECONNECT &&
        uiEvent.payload.target === 'normal' &&
        uiEvent.payload.method === 'manual';

    const getHeading = () => {
        if (isRebootDone) {
            return 'TR_RECONNECT_IN_BOOTLOADER_SUCCESS';
        }

        if (toNormal) {
            return 'TR_RECONNECT_IN_NORMAL';
        }

        return isManualRebootRequired ? 'TR_RECONNECT_IN_BOOTLOADER' : 'TR_REBOOT_INTO_BOOTLOADER';
    };

    const getSecondStep = () => {
        if (toNormal) {
            return 'FIRMWARE_CONNECT_IN_NORMAL_MODEL_NO_BUTTON';
        }

        // internal_model cannot be read from features while in bootloader mode.
        const deviceModelFromEvent = uiEvent?.payload.device.features?.internal_model;

        if (deviceModelFromEvent === undefined) {
            // Fallback. This should never happen.
            return 'TR_SWITCH_TO_BOOTLOADER_HOLD_LEFT_BUTTON';
        }

        const deviceFwVersion = getFirmwareVersion(uiEvent?.payload.device);
        const switchToBootloaderMap: Record<DeviceModelInternal, TranslationKey> = {
            [DeviceModelInternal.T1B1]:
                semver.valid(deviceFwVersion) && semver.satisfies(deviceFwVersion, '<1.8.0')
                    ? 'TR_SWITCH_TO_BOOTLOADER_HOLD_BOTH_BUTTONS'
                    : 'TR_SWITCH_TO_BOOTLOADER_HOLD_LEFT_BUTTON',
            [DeviceModelInternal.T2T1]: 'TR_SWITCH_TO_BOOTLOADER_SWIPE_YOUR_FINGERS',
            [DeviceModelInternal.T2B1]: 'TR_SWITCH_TO_BOOTLOADER_HOLD_LEFT_BUTTON',
            [DeviceModelInternal.T3B1]: 'TR_SWITCH_TO_BOOTLOADER_HOLD_LEFT_BUTTON',
            [DeviceModelInternal.T3T1]: 'TR_SWITCH_TO_BOOTLOADER_SWIPE_YOUR_FINGERS',
            [DeviceModelInternal.T3W1]: 'TR_SWITCH_TO_BOOTLOADER_SWIPE_YOUR_FINGERS',
        };

        return switchToBootloaderMap[deviceModelFromEvent];
    };

    return (
        <NewModal.Backdrop onClick={isAbortable ? onClose : undefined}>
            {!isManualRebootRequired && !isRebootDone && (
                <ConfirmOnDevice
                    title={<Translation id="TR_CONFIRM_ON_TREZOR" />}
                    deviceModelInternal={deviceModelInternal}
                    deviceUnitColor={device?.features?.unit_color}
                    isConfirmed={uiEvent?.type !== 'button'}
                />
            )}
            <NewModal.ModalBase
                onCancel={isAbortable ? onClose : undefined}
                data-testid="@firmware/reconnect-device"
                size="tiny"
                bottomContent={
                    isRebootDone && (
                        <NewModal.Button onClick={onSuccess} data-testid="@firmware/install-button">
                            <Translation id="TR_INSTALL" />
                        </NewModal.Button>
                    )
                }
            >
                {!isRebootDone && (
                    <ImageWrapper>
                        <RebootDeviceGraphics
                            device={uiEvent?.payload.device}
                            isManualRebootRequired={isManualRebootRequired}
                        />
                    </ImageWrapper>
                )}
                <H2 align="center">
                    <Translation id={getHeading()} />
                </H2>
                {!isRebootDone && (
                    <>
                        {isManualRebootRequired ? (
                            <List isOrdered margin={{ top: spacings.md }}>
                                {/* First step asks for disconnecting a device */}
                                <List.Item data-testid="@firmware/disconnect-message">
                                    <Translation id="TR_DISCONNECT_YOUR_DEVICE" />
                                </List.Item>

                                {/* Second step reconnect in bootloader */}
                                <List.Item data-testid="@firmware/connect-in-bootloader-message">
                                    <Translation id={getSecondStep()} />
                                </List.Item>
                            </List>
                        ) : (
                            <Paragraph
                                typographyStyle="hint"
                                variant="tertiary"
                                align="center"
                                margin={{ top: spacings.xs }}
                            >
                                <Translation
                                    id="TR_CONFIRM_ACTION_ON_YOUR"
                                    values={{ deviceLabel }}
                                />
                            </Paragraph>
                        )}
                        {showWebUsbButton && <WebUsbButton />}
                    </>
                )}
            </NewModal.ModalBase>
        </NewModal.Backdrop>
    );
};
