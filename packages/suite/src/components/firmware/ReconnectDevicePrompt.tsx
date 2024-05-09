import { ReactNode } from 'react';
import styled, { css } from 'styled-components';
import * as semver from 'semver';

import { pickByDeviceModel, getFirmwareVersion } from '@trezor/device-utils';
import { H2, Button, ConfirmOnDevice, variables, DeviceAnimation } from '@trezor/components';
import { DEVICE, Device, DeviceModelInternal, UI } from '@trezor/connect';
import { Modal, Translation, WebUsbButton } from 'src/components/suite';
import { DeviceConfirmImage } from 'src/components/suite/DeviceConfirmImage';
import { useDevice, useFirmware } from 'src/hooks/suite';
import { AbortButton } from 'src/components/suite/modals/AbortButton';

const StyledModal = styled(Modal)`
    width: 580px;

    ${Modal.Body} {
        padding: 38px 22px 6px;
    }
`;

const Wrapper = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-around;

    ${variables.SCREEN_QUERY.MOBILE} {
        flex-direction: column;
    }
`;

const Content = styled.div`
    display: flex;
    flex-direction: column;
    padding: 10px 14px;
    margin-left: 24px;
`;

const BulletPointWrapper = styled.div`
    display: flex;
    align-items: center;

    & + & {
        margin-top: 24px;
    }
`;

const BulletPointNumber = styled.div<{ $active?: boolean }>`
    display: flex;
    flex: 0 0 auto;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    justify-content: center;
    align-items: center;
    margin-right: 14px;
    font-size: ${variables.FONT_SIZE.SMALL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    color: ${({ theme }) => theme.TYPE_LIGHT_GREY};
    background: ${({ theme }) => theme.BG_GREY};
    font-variant-numeric: tabular-nums;

    ${({ $active, theme }) =>
        $active &&
        css`
            color: ${theme.TYPE_GREEN};
            background: ${theme.BG_LIGHT_GREEN};
        `}
`;

const BulletPointText = styled.span<{ $active?: boolean }>`
    font-size: ${variables.FONT_SIZE.NORMAL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    color: ${({ theme, $active }) => ($active ? theme.TYPE_GREEN : theme.TYPE_LIGHT_GREY)};
    text-align: left;
`;

const CenteredPointText = styled(BulletPointText)`
    text-align: center;
`;

const StyledDeviceAnimation = styled(DeviceAnimation)`
    flex: 0 0 220px;
    width: 220px;
    height: 220px;

    ${variables.SCREEN_QUERY.MOBILE} {
        align-self: center;
    }
`;

const StyledConfirmImage = styled(DeviceConfirmImage)`
    flex: 0 0 200px;
    width: 200px;
    height: 200px;
`;

const Heading = styled(H2)`
    margin-bottom: 16px;
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
`;

const StyledWebUsbButton = styled(WebUsbButton)`
    margin-top: 24px;
`;

const StyledAbortButton = styled(AbortButton)`
    position: absolute;
    top: 12px;
    right: 12px;
`;

interface ReconnectStepProps {
    order?: number;
    active: boolean;
    children: ReactNode;
    dataTest: string;
}

const ReconnectStep = ({ order, active, dataTest, children }: ReconnectStepProps) => (
    <BulletPointWrapper>
        {order && <BulletPointNumber $active={active}>{order}</BulletPointNumber>}

        <BulletPointText $active={active} data-test={active ? dataTest : undefined}>
            {children}
        </BulletPointText>
    </BulletPointWrapper>
);

const RebootDeviceGraphics = ({
    device,
    isManualRebootRequired,
}: {
    device?: Device;
    isManualRebootRequired: boolean;
}) => {
    if (!isManualRebootRequired) {
        return device ? <StyledConfirmImage device={device} /> : null;
    }

    const deviceModelInternal = device?.features?.internal_model;

    // T1B1 bootloader before firmware version 1.8.0 can only be invoked by holding both buttons
    const deviceFwVersion = device?.features ? getFirmwareVersion(device) : '';
    const type =
        deviceModelInternal === DeviceModelInternal.T1B1 &&
        semver.valid(deviceFwVersion) &&
        semver.satisfies(deviceFwVersion, '<1.8.0')
            ? 'BOOTLOADER_TWO_BUTTONS'
            : 'BOOTLOADER';

    return (
        <StyledDeviceAnimation
            type={type}
            height="220px"
            width="220px"
            shape="ROUNDED"
            deviceModelInternal={deviceModelInternal}
            loop
        />
    );
};

interface ReconnectDevicePromptProps {
    onClose: () => void;
    onSuccess: () => void;
}

export const ReconnectDevicePrompt = ({ onClose, onSuccess }: ReconnectDevicePromptProps) => {
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
    const isAbortable = isManualRebootRequired && rebootPhase == 'waiting-for-reboot';
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
        const deviceFwVersion = getFirmwareVersion(uiEvent?.payload.device);
        const deviceModelInternal = uiEvent?.payload.device.features?.internal_model;

        if (toNormal) {
            return 'FIRMWARE_CONNECT_IN_NORMAL_MODEL_NO_BUTTON';
        }

        return pickByDeviceModel(deviceModelInternal, {
            default: 'TR_SWITCH_TO_BOOTLOADER_HOLD_LEFT_BUTTON',
            [DeviceModelInternal.T1B1]:
                semver.valid(deviceFwVersion) && semver.satisfies(deviceFwVersion, '<1.8.0')
                    ? 'TR_SWITCH_TO_BOOTLOADER_HOLD_BOTH_BUTTONS'
                    : 'TR_SWITCH_TO_BOOTLOADER_HOLD_LEFT_BUTTON',
            [DeviceModelInternal.T2T1]: 'TR_SWITCH_TO_BOOTLOADER_SWIPE_YOUR_FINGERS',
            [DeviceModelInternal.T2B1]: 'TR_SWITCH_TO_BOOTLOADER_HOLD_LEFT_BUTTON',
            [DeviceModelInternal.T3T1]: 'TR_SWITCH_TO_BOOTLOADER_SWIPE_YOUR_FINGERS',
        } as const);
    };

    return (
        <StyledModal
            modalPrompt={
                !isManualRebootRequired && (
                    <ConfirmOnDevice
                        title={<Translation id="TR_CONFIRM_ON_TREZOR" />}
                        deviceModelInternal={deviceModelInternal}
                        deviceUnitColor={device?.features?.unit_color}
                        isConfirmed={uiEvent?.type !== 'button'}
                    />
                )
            }
        >
            {isAbortable && <StyledAbortButton onAbort={onClose} />}

            <Wrapper data-test="@firmware/reconnect-device">
                {!isRebootDone && (
                    <RebootDeviceGraphics
                        device={uiEvent?.payload.device}
                        isManualRebootRequired={isManualRebootRequired}
                    />
                )}

                <Content>
                    <Heading>
                        <Translation id={getHeading()} />
                    </Heading>

                    {!isRebootDone ? (
                        <>
                            {isManualRebootRequired ? (
                                <>
                                    {/* First step asks for disconnecting a device */}
                                    <ReconnectStep
                                        order={1}
                                        active={rebootPhase !== 'disconnected'}
                                        dataTest="@firmware/disconnect-message"
                                    >
                                        <Translation id="TR_DISCONNECT_YOUR_DEVICE" />
                                    </ReconnectStep>

                                    {/* Second step reconnect in bootloader */}
                                    <ReconnectStep
                                        order={2}
                                        active={rebootPhase === 'disconnected'}
                                        dataTest="@firmware/connect-in-bootloader-message"
                                    >
                                        <Translation id={getSecondStep()} />
                                    </ReconnectStep>
                                </>
                            ) : (
                                <CenteredPointText>
                                    <Translation
                                        id="TR_CONFIRM_ACTION_ON_YOUR"
                                        values={{ deviceLabel: device?.label }}
                                    />
                                </CenteredPointText>
                            )}
                            {showWebUsbButton && <StyledWebUsbButton />}
                        </>
                    ) : (
                        <>
                            <Button onClick={onSuccess} data-test="@firmware/install-button">
                                <Translation id="TR_INSTALL" />
                            </Button>
                        </>
                    )}
                </Content>
            </Wrapper>
        </StyledModal>
    );
};
