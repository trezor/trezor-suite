import React from 'react';
import styled, { css } from 'styled-components';
import * as semver from 'semver';

import { H1, Button, ConfirmOnDevice, variables } from '@trezor/components';
import { Translation, WebusbButton } from '@suite-components';
import DeviceConfirmImage from '@suite-components/images/DeviceConfirmImage';
import DeviceAnimation from '@onboarding-components/DeviceAnimation';
import { useDevice, useFirmware } from '@suite-hooks';
import { isDesktop, isMacOs } from '@suite-utils/env';
import { DESKTOP_WRAPPER_BORDER_WIDTH } from '@suite-constants/layout';
import { getDeviceModel, getFwVersion } from '@suite/utils/suite/device';

import type { TrezorDevice } from '@suite/types/suite';
import {
    useRebootRequest,
    RebootRequestedMode,
    RebootPhase,
    RebootMethod,
} from '@firmware-hooks/useRebootRequest';

const Wrapper = styled.div`
    display: flex;
    padding: 24px;
    box-shadow: 0 2px 5px 0 ${props => props.theme.BOX_SHADOW_BLACK_20};
    background: ${props => props.theme.BG_WHITE};
    border-radius: 16px;
    max-width: 560px;
`;

const Overlay = styled.div<{ desktopBorder?: string }>`
    position: fixed;
    z-index: 10000;
    width: ${props => (props.desktopBorder ? `calc(100% - (${props.desktopBorder} * 2))` : '100%')};
    height: ${props => (props.desktopBorder ? `calc(100% - ${props.desktopBorder})` : '100%')};
    top: 0px;
    left: ${props => props.desktopBorder || 0};
    background: rgba(0, 0, 0, 0.3);
    backdrop-filter: blur(5px);
    display: flex;
    align-items: center;
    overflow: auto;
    justify-content: center;
    flex-direction: column;
`;

const Content = styled.div`
    display: flex;
    flex-direction: column;
    padding: 10px 14px;
    margin-left: 24px;
`;

const Bottom = styled.div`
    display: flex;
    flex: 1;
    align-items: flex-end;
    justify-content: center;
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
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    background: ${props => props.theme.BG_GREY};
    font-variant-numeric: tabular-nums;

    ${props =>
        props.active &&
        css`
            color: ${props => props.theme.TYPE_GREEN};
            background: ${props => props.theme.BG_LIGHT_GREEN};
        `}
`;
const BulletPointText = styled.span<{ active?: boolean }>`
    font-size: ${variables.FONT_SIZE.NORMAL};
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
    color: ${props => props.theme.TYPE_LIGHT_GREY};
    text-align: left;
    ${props =>
        props.active &&
        css`
            color: ${props => props.theme.TYPE_GREEN};
        `}
`;

const StyledDeviceAnimation = styled(DeviceAnimation)`
    flex: 0 0 200px;
    width: 200px;
    height: 200px;
`;

const StyledConfirmImage = styled(DeviceConfirmImage)`
    flex: 0 0 200px;
    width: 200px;
    height: 200px;
`;

const Heading = styled(H1)`
    margin-bottom: 16px;
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
`;

const StyledWebusbButton = styled(WebusbButton)`
    margin-top: 24px;
`;

const ConfirmOnDeviceHeader = styled.div`
    margin-bottom: 25px;
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
        if (phase === 'done') return <Translation id="TR_RECONNECT_IN_BOOTLOADER_SUCCESS" />;
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
    const deviceFwVersion = device?.features ? getFwVersion(device) : '';
    const deviceModel = device?.features ? getDeviceModel(device) : 'T';
    if (requestedMode === 'bootloader') {
        if (deviceModel === '1') {
            return semver.valid(deviceFwVersion) && semver.satisfies(deviceFwVersion, '<1.8.0') ? (
                <Translation id="TR_HOLD_BOTH_BUTTONS" />
            ) : (
                <Translation id="TR_HOLD_LEFT_BUTTON" />
            );
        }
        return <Translation id="TR_SWIPE_YOUR_FINGERS" />;
    }
    return deviceModel === '1' ? (
        <Translation id="FIRMWARE_CONNECT_IN_NORMAL_MODEL_1" />
    ) : (
        <Translation id="FIRMWARE_CONNECT_IN_NORMAL_MODEL_2" />
    );
};

const ReconnectStep: React.FC<{
    order?: number;
    active: boolean;
    dataTest: string;
}> = ({ order, active, dataTest, children }) => (
    <BulletPointWrapper>
        {order && <BulletPointNumber active={active}>{order}</BulletPointNumber>}
        <BulletPointText active={active} data-test={active ? dataTest : undefined}>
            {children}
        </BulletPointText>
    </BulletPointWrapper>
);

const RebootDeviceGraphics = ({
    device,
    method,
}: {
    device?: TrezorDevice;
    method: RebootMethod;
}) => {
    if (method === 'automatic') return device ? <StyledConfirmImage device={device} /> : null;
    return (
        <StyledDeviceAnimation type="BOOTLOADER" size={200} shape="ROUNDED" device={device} loop />
    );
};

interface Props {
    expectedDevice?: TrezorDevice;
    requestedMode: RebootRequestedMode;
    onSuccess?: () => void;
}

const ReconnectDevicePrompt = ({ expectedDevice, requestedMode, onSuccess }: Props) => {
    const { device } = useDevice();
    const { isWebUSB } = useFirmware();
    const { rebootPhase, rebootMethod } = useRebootRequest(device, requestedMode);

    return (
        <Overlay
            desktopBorder={isDesktop() && !isMacOs() ? DESKTOP_WRAPPER_BORDER_WIDTH : undefined}
        >
            {rebootMethod === 'automatic' && (
                <ConfirmOnDeviceHeader>
                    <ConfirmOnDevice
                        title={<Translation id="TR_CONFIRM_ON_TREZOR" />}
                        trezorModel={device?.features?.major_version === 1 ? 1 : 2}
                        animated
                        animation={rebootPhase !== 'wait-for-confirm' ? 'SLIDE_DOWN' : 'SLIDE_UP'}
                    />
                </ConfirmOnDeviceHeader>
            )}
            <Wrapper data-test={`@firmware/reconnect-device/${requestedMode}`}>
                <RebootDeviceGraphics device={expectedDevice} method={rebootMethod} />
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
                            {rebootMethod === 'automatic' ? (
                                <ReconnectStep active dataTest="@firmware/confirm-reboot-message">
                                    <Translation
                                        id="TR_CONFIRM_ACTION_ON_YOUR"
                                        values={{ deviceLabel: expectedDevice?.label }}
                                    />
                                </ReconnectStep>
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
                                            device={device}
                                        />
                                    </ReconnectStep>
                                </>
                            )}
                            {rebootPhase === 'disconnected' && isWebUSB && <StyledWebusbButton />}
                        </>
                    ) : (
                        <Bottom>
                            {requestedMode === 'bootloader' && (
                                <Button onClick={onSuccess} data-test="@firmware/install-button">
                                    <Translation id="TR_INSTALL" />
                                </Button>
                            )}
                        </Bottom>
                    )}
                </Content>
            </Wrapper>
        </Overlay>
    );
};

export { ReconnectDevicePrompt };
