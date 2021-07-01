import React from 'react';
import { useSpring, config, animated } from 'react-spring';
import styled from 'styled-components';

import { variables, Icon, Button } from '@trezor/components';
import { DeviceAnimation } from '@onboarding-components';
import { Translation } from '@suite-components';
import { useDevice, useTheme, useActions } from '@suite-hooks';
import * as routerActions from '@suite-actions/routerActions';

const Wrapper = styled(animated.div)`
    display: flex;
    height: 122px;
    min-height: 122px;
    width: 360px;
    border-radius: 61px;
    padding: 10px;
    background: ${props => props.theme.BG_WHITE};
    align-items: center;
    box-shadow: 0 2px 5px 0 ${props => props.theme.BOX_SHADOW_BLACK_20};
    margin-bottom: 60px;
`;

const ImageWrapper = styled.div`
    display: flex;
    position: relative;
`;
const Checkmark = styled.div`
    display: flex;
    position: absolute;
    top: 0;
    right: 0;
    z-index: 1;
`;

const Text = styled.div`
    display: flex;
    flex-direction: column;
    margin: 0px 32px;
    text-align: center;
    color: ${props => props.theme.TYPE_DARK_GREY};
    font-size: 20px;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};

    button {
        margin-top: 10px;
    }
`;

interface Props {
    children?: React.ReactNode;
    connected: boolean;
    showWarning: boolean;
    allowSwitchDevice?: boolean;
}

const getDefaultMessage = (connected: boolean, showWarning: boolean) => {
    if (connected) {
        return !showWarning ? 'TR_DEVICE_CONNECTED' : 'TR_DEVICE_CONNECTED_WRONG_STATE';
    }
    return 'TR_CONNECT_YOUR_DEVICE';
};
const ConnectDevicePrompt = ({ children, connected, showWarning, allowSwitchDevice }: Props) => {
    const { theme } = useTheme();
    const { device } = useDevice();
    const { goto } = useActions({
        goto: routerActions.goto,
    });
    const fadeStyles = useSpring({
        config: config.default,
        transform: 'translate(0px, 0px)',
        from: { opacity: 0, transform: 'translate(0px, -50px)' },
        to: {
            opacity: 1,
            transform: 'translate(0px, 0px)',
        },
        delay: 200,
    });

    return (
        <Wrapper style={fadeStyles} data-test="@connect-device-prompt">
            <ImageWrapper>
                <DeviceAnimation
                    type="CONNECT"
                    device={device}
                    loop={!connected}
                    shape="CIRCLE"
                    size={100}
                />
                <Checkmark>
                    {connected && !showWarning && (
                        <Icon icon="CHECK_ACTIVE" size={24} color={theme.TYPE_GREEN} />
                    )}
                    {showWarning && (
                        <Icon icon="WARNING_ACTIVE" size={24} color={theme.TYPE_ORANGE} />
                    )}
                </Checkmark>
            </ImageWrapper>
            <Text>
                {children || <Translation id={getDefaultMessage(connected, showWarning)} />}
                {allowSwitchDevice && (
                    <Button
                        variant="tertiary"
                        onClick={() => goto('suite-switch-device', { cancelable: true })}
                    >
                        <Translation id="TR_SWITCH_DEVICE" />
                    </Button>
                )}
            </Text>
        </Wrapper>
    );
};

export default ConnectDevicePrompt;
