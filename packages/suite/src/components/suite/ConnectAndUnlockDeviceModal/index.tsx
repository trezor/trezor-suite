import React from 'react';
import { useSpring, config, animated } from 'react-spring';
import { variables, ModalOverlay, Icon } from '@trezor/components';
import { DeviceAnimation } from '@onboarding-components';
import { useDevice } from '@suite-hooks';
import styled from 'styled-components';
import { Translation } from '../Translation';

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
`;

const ImageWrapper = styled.div`
    display: flex;
    position: relative;
`;

const Text = styled.div`
    display: flex;
    margin: 0px 16px;
    text-align: center;
    color: ${props => props.theme.TYPE_DARK_GREY};
    font-size: 20px;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};
`;

const CloseWrapper = styled.div`
    position: absolute;
    align-items: center;
    top: -15px;
    right: -15px;
    cursor: pointer;
`;

const Close = styled.div`
    border-radius: 100%;
    cursor: pointer;
    background: ${props => props.theme.BG_GREY};
    width: 35px;
    height: 35px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding-bottom: 1px;
`;

interface Props {
    onClose: () => void;
}

const ConnectAndUnlockDeviceModal = ({ onClose }: Props) => {
    const { device } = useDevice();
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
        <ModalOverlay>
            <Wrapper style={fadeStyles}>
                <ImageWrapper>
                    <DeviceAnimation
                        type="CONNECT"
                        version={device?.features?.model}
                        loop={!device?.connected}
                        shape="CIRCLE"
                        size={100}
                    />
                </ImageWrapper>
                <Text>
                    <Translation id="TR_CONNECT_AND_UNLOCK" />
                </Text>
                <CloseWrapper>
                    <Close onClick={onClose}>
                        <Icon icon="CROSS" size={23} />
                    </Close>
                </CloseWrapper>
            </Wrapper>
        </ModalOverlay>
    );
};

export default ConnectAndUnlockDeviceModal;
