import { ReactNode } from 'react';
import styled, { css } from 'styled-components';
import * as semver from 'semver';

import { pickByDeviceModel, getFirmwareVersion } from '@trezor/device-utils';
import {
    H2,
    Button,
    ConfirmOnDevice,
    variables,
    DeviceAnimation,
    AnimationDeviceType,
} from '@trezor/components';
import { DeviceModelInternal } from '@trezor/connect';
import { Modal, Translation, WebUsbButton } from 'src/components/suite';
import { DeviceConfirmImage } from 'src/components/suite/DeviceConfirmImage';
import { useDevice, useFirmware } from 'src/hooks/suite';
import {
    useRebootRequest,
    RebootRequestedMode,
    RebootPhase,
    RebootMethod,
} from 'src/hooks/firmware/useRebootRequest';
import type { TrezorDevice } from 'src/types/suite';
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

const BulletPointNumber = styled.div<{ active?: boolean }>`
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

    ${({ active, theme }) =>
        active &&
        css`
            color: ${theme.TYPE_GREEN};
            background: ${theme.BG_LIGHT_GREEN};
        `}
`;

const BulletPointText = styled.span<{ active?: boolean }>`
    font-size: ${variables.FONT_SIZE.NORMAL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    color: ${({ theme, active }) => (active ? theme.TYPE_GREEN : theme.TYPE_LIGHT_GREY)};
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

const HeadingText = ({
    requestedMode,
    phase,
    method,
}: {
    requestedMode: RebootRequestedMode;
    phase: RebootPhase;
    method: RebootMethod;
}) => {
    if (requestedMode === 'bootloader') {
        if (phase === 'done') {
            return <Translation id="TR_RECONNECT_IN_BOOTLOADER_SUCCESS" />;
        }

        return method === 'automatic' ? (
            <Translation id="TR_REBOOT_INTO_BOOTLOADER" />
        ) : (
            <Translation id="TR_RECONNECT_IN_BOOTLOADER" />
        );
    }

    return phase === 'done' ? (
        <Translation id="TR_RECONNECT_IN_NORMAL_SUCCESS" />
    ) : (
        <Translation id="TR_RECONNECT_IN_NORMAL" />
    );
};

const ReconnectLabel = ({
    requestedMode,
    device,
}: {
    requestedMode: RebootRequestedMode;
    device?: TrezorDevice;
}) => {
    const deviceFwVersion = getFirmwareVersion(device);
    const deviceModelInternal = device?.features?.internal_model;

    if (requestedMode === 'bootloader') {
        const switchToBootloaderModeMessage = pickByDeviceModel(deviceModelInternal, {
            default: 'TR_SWITCH_TO_BOOTLOADER_HOLD_LEFT_BUTTON',
            [DeviceModelInternal.T1B1]:
                semver.valid(deviceFwVersion) && semver.satisfies(deviceFwVersion, '<1.8.0')
                    ? 'TR_SWITCH_TO_BOOTLOADER_HOLD_BOTH_BUTTONS'
                    : 'TR_SWITCH_TO_BOOTLOADER_HOLD_LEFT_BUTTON',
            [DeviceModelInternal.T2T1]: 'TR_SWITCH_TO_BOOTLOADER_SWIPE_YOUR_FINGERS',
        } as const);

        return <Translation id={switchToBootloaderModeMessage} />;
    }

    const switchToNormalModeMessage = pickByDeviceModel(deviceModelInternal, {
        default: 'FIRMWARE_CONNECT_IN_NORMAL_MODEL_NO_BUTTON',
        [DeviceModelInternal.T2B1]: 'FIRMWARE_CONNECT_IN_NORMAL_MODEL_NO_TOUCH',
    } as const);

    return <Translation id={switchToNormalModeMessage} />;
};

interface ReconnectStepProps {
    order?: number;
    active: boolean;
    children: ReactNode;
    dataTest: string;
}

const ReconnectStep = ({ order, active, dataTest, children }: ReconnectStepProps) => (
    <BulletPointWrapper>
        {order && <BulletPointNumber active={active}>{order}</BulletPointNumber>}

        <BulletPointText active={active} data-test-id={active ? dataTest : undefined}>
            {children}
        </BulletPointText>
    </BulletPointWrapper>
);

const RebootDeviceGraphics = ({
    device,
    method,
    requestedMode,
}: {
    device?: TrezorDevice;
    method: RebootMethod;
    requestedMode: RebootRequestedMode;
}) => {
    if (method === 'automatic') {
        return device ? <StyledConfirmImage device={device} /> : null;
    }

    const deviceModelInternal = device?.features?.internal_model;

    // T1B1 bootloader before firmware version 1.8.0 can only be invoked by holding both buttons
    const deviceFwVersion = device?.features ? getFirmwareVersion(device) : '';
    let type: AnimationDeviceType = requestedMode === 'bootloader' ? 'BOOTLOADER' : 'NORMAL';
    if (
        type === 'BOOTLOADER' &&
        deviceModelInternal === DeviceModelInternal.T1B1 &&
        semver.valid(deviceFwVersion) &&
        semver.satisfies(deviceFwVersion, '<1.8.0')
    ) {
        type = 'BOOTLOADER_TWO_BUTTONS';
    }

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
    expectedDevice?: TrezorDevice;
    requestedMode: RebootRequestedMode;
    onSuccess?: () => void;
    onClose?: () => void;
}

export const ReconnectDevicePrompt = ({
    expectedDevice,
    requestedMode,
    onSuccess,
    onClose,
}: ReconnectDevicePromptProps) => {
    const { device } = useDevice();
    const { isWebUSB } = useFirmware();
    const { rebootPhase, rebootMethod } = useRebootRequest(device, requestedMode);

    const isRebootAutomatic = rebootMethod === 'automatic';
    const isAnimationVisible = requestedMode === 'bootloader' && rebootPhase !== 'done';
    const deviceModelInternal = device?.features?.internal_model;

    return (
        <StyledModal
            modalPrompt={
                isRebootAutomatic && (
                    <ConfirmOnDevice
                        title={<Translation id="TR_CONFIRM_ON_TREZOR" />}
                        deviceModelInternal={deviceModelInternal}
                        deviceUnitColor={device?.features?.unit_color}
                        isConfirmed={rebootPhase !== 'wait-for-confirm'}
                    />
                )
            }
        >
            {onClose && rebootPhase === 'initial' && <StyledAbortButton onAbort={onClose} />}

            <Wrapper data-test-id={`@firmware/reconnect-device/${requestedMode}`}>
                {isAnimationVisible && (
                    <RebootDeviceGraphics
                        device={expectedDevice}
                        method={rebootMethod}
                        requestedMode={requestedMode}
                    />
                )}

                <Content>
                    <Heading>
                        <HeadingText
                            requestedMode={requestedMode}
                            phase={rebootPhase}
                            method={rebootMethod}
                        />
                    </Heading>

                    {rebootPhase !== 'done' ? (
                        <>
                            {isRebootAutomatic ? (
                                <CenteredPointText>
                                    <Translation
                                        id="TR_CONFIRM_ACTION_ON_YOUR"
                                        values={{ deviceLabel: expectedDevice?.label }}
                                    />
                                </CenteredPointText>
                            ) : (
                                <>
                                    {/* First step asks for disconnecting a device */}
                                    <ReconnectStep
                                        order={1}
                                        active={rebootPhase !== 'disconnected'}
                                        dataTest="@firmware/disconnect-message"
                                    >
                                        <Translation id="TR_DISCONNECT_YOUR_DEVICE" />
                                    </ReconnectStep>

                                    {/* Second step reconnect in normal mode or bootloader */}
                                    <ReconnectStep
                                        order={2}
                                        active={rebootPhase === 'disconnected'}
                                        dataTest={`@firmware/connect-in-${requestedMode}-message`}
                                    >
                                        <ReconnectLabel
                                            requestedMode={requestedMode}
                                            device={expectedDevice}
                                        />
                                    </ReconnectStep>
                                </>
                            )}
                            {rebootPhase === 'disconnected' && isWebUSB && <StyledWebUsbButton />}
                        </>
                    ) : (
                        <>
                            {requestedMode === 'bootloader' && (
                                <Button onClick={onSuccess} data-test-id="@firmware/install-button">
                                    <Translation id="TR_INSTALL" />
                                </Button>
                            )}
                        </>
                    )}
                </Content>
            </Wrapper>
        </StyledModal>
    );
};
