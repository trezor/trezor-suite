import React, { useState, useEffect } from 'react';
import styled, { css } from 'styled-components';
import * as semver from 'semver';

import { H1, Button, variables } from '@trezor/components';
import { Translation, WebusbButton } from '@suite-components';
import DeviceAnimation from '@onboarding-components/DeviceAnimation';
import { useDevice, useFirmware } from '@suite-hooks';
import { isDesktop, isMacOs } from '@suite-utils/env';
import { DESKTOP_WRAPPER_BORDER_WIDTH } from '@suite-constants/layout';
import { getDeviceModel, getFwVersion } from '@suite/utils/suite/device';

import type { TrezorDevice } from '@suite/types/suite';

const Wrapper = styled.div`
    display: flex;
    flex: 1;
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

const Heading = styled(H1)`
    margin-bottom: 16px;
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
`;

const getTextForMode = (requestedMode: 'bootloader' | 'normal', device?: TrezorDevice) => {
    const deviceFwVersion = device?.features ? getFwVersion(device) : '';
    const deviceModel = device?.features ? getDeviceModel(device) : 'T';

    const text = {
        bootloader: {
            headingStart: <Translation id="TR_RECONNECT_IN_BOOTLOADER" />,
            headingSuccess: <Translation id="TR_RECONNECT_IN_BOOTLOADER_SUCCESS" />,
            steps: [
                {
                    dataTest: '@firmware/disconnect-message',
                    label: <Translation id="TR_DISCONNECT_YOUR_DEVICE" />,
                },
                {
                    dataTest: '@firmware/connect-in-bootloader-message',
                    label:
                        // eslint-disable-next-line no-nested-ternary
                        deviceModel === '1' ? (
                            semver.valid(deviceFwVersion) &&
                            semver.satisfies(deviceFwVersion, '<1.8.0') ? (
                                <Translation id="TR_HOLD_BOTH_BUTTONS" />
                            ) : (
                                <Translation id="TR_HOLD_LEFT_BUTTON" />
                            )
                        ) : (
                            <Translation id="TR_SWIPE_YOUR_FINGERS" />
                        ),
                },
            ],
        },
        normal: {
            headingStart: <Translation id="TR_RECONNECT_IN_NORMAL" />,
            headingSuccess: <Translation id="TR_RECONNECT_IN_NORMAL_SUCCESS" />,
            steps: [
                {
                    dataTest: '@firmware/disconnect-message',
                    label: <Translation id="TR_DISCONNECT_YOUR_DEVICE" />,
                },
                {
                    dataTest: '@firmware/connect-in-normal-message',
                    label:
                        deviceModel === '1' ? (
                            <Translation id="FIRMWARE_CONNECT_IN_NORMAL_MODEL_1" />
                        ) : (
                            <Translation id="FIRMWARE_CONNECT_IN_NORMAL_MODEL_2" />
                        ),
                },
            ],
        },
    };

    return text[requestedMode];
};
interface Props {
    expectedDevice?: TrezorDevice;
    requestedMode: 'bootloader' | 'normal';
}

const ReconnectDevicePrompt = ({ expectedDevice, requestedMode }: Props) => {
    const { device } = useDevice();
    const { firmwareUpdate, isWebUSB } = useFirmware();
    // local state to track if the user actually unplugged the device. Otherwise if the device is
    // in bootloader and we prompt user to reconnect again in bootloader we would immediately render success state
    const [wasUnplugged, setWasUnplugged] = useState(false);
    const isDeviceConnected = !!device?.connected;

    useEffect(() => {
        if (!isDeviceConnected) {
            setWasUnplugged(true);
        }
    }, [isDeviceConnected]);

    const activeStep = device?.connected ? 0 : 1; // 0: disconnect device, 1: instructions to reconnect in bootloader
    const showWebUSB = !device?.connected && isWebUSB;
    const isStepActive = (num: number) => activeStep === num;
    const text = getTextForMode(requestedMode, device);

    // Either the device is connect and in bl mode OR
    // special case where device isn't reporting bootloader mode, but it is already in it.
    const reconnectedInBootloader =
        device?.connected &&
        (device?.mode === 'bootloader' || device?.features?.firmware_present !== null) &&
        wasUnplugged;

    const reconnectedInNormal = device?.connected && device?.mode === 'normal' && wasUnplugged;
    const reconnectedInRequestedMode =
        requestedMode === 'bootloader' ? reconnectedInBootloader : reconnectedInNormal;

    const successAction =
        requestedMode === 'bootloader' ? (
            <Button onClick={firmwareUpdate} data-test="@firmware/install-button">
                <Translation id="TR_INSTALL" />
            </Button>
        ) : undefined;

    return (
        <Overlay
            desktopBorder={isDesktop() && !isMacOs() ? DESKTOP_WRAPPER_BORDER_WIDTH : undefined}
        >
            <Wrapper data-test={`@firmware/reconnect-device/${requestedMode}`}>
                <StyledDeviceAnimation
                    type="BOOTLOADER"
                    size={200}
                    shape="ROUNDED"
                    device={expectedDevice}
                    loop
                />
                <Content>
                    <Heading>
                        {!reconnectedInRequestedMode ? text.headingStart : text.headingSuccess}
                    </Heading>
                    {!reconnectedInRequestedMode ? (
                        text.steps.map((step, i) => (
                            // static array, using index as a key is fine
                            // eslint-disable-next-line react/no-array-index-key
                            <React.Fragment key={i}>
                                {/* First step asks for disconnecting a device */}
                                {/* Second step reconnect in normal mode or bootloader */}
                                <BulletPointWrapper>
                                    <BulletPointNumber active={isStepActive(i)}>
                                        {i + 1}
                                    </BulletPointNumber>
                                    <BulletPointText
                                        active={isStepActive(i)}
                                        data-test={isStepActive(i) ? step.dataTest : undefined}
                                    >
                                        {step.label}
                                    </BulletPointText>
                                </BulletPointWrapper>
                                {isStepActive(2) && showWebUSB && <WebusbButton />}
                            </React.Fragment>
                        ))
                    ) : (
                        <Bottom>{successAction}</Bottom>
                    )}
                </Content>
            </Wrapper>
        </Overlay>
    );
};

export { ReconnectDevicePrompt };
