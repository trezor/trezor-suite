import styled from 'styled-components';

import {
    variables,
    Icon,
    Button,
    useTheme,
    motionEasing,
    LottieAnimation,
} from '@trezor/components';
import { Translation } from 'src/components/suite';
import { useDevice, useDispatch } from 'src/hooks/suite';
import { goto } from 'src/actions/suite/routerActions';
import type { PrerequisiteType } from 'src/types/suite';
import { motion } from 'framer-motion';

const Wrapper = styled(motion.div)`
    display: flex;
    height: 122px;
    min-height: 122px;
    width: 360px;
    border-radius: 61px;
    padding: 10px;
    background: ${({ theme }) => theme.BG_WHITE};
    align-items: center;
    box-shadow: 0 2px 5px 0 ${({ theme }) => theme.BOX_SHADOW_BLACK_20};
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
`;

const Text = styled.div`
    display: flex;
    flex-direction: column;
    margin: 0 32px;
    text-align: center;
    color: ${({ theme }) => theme.TYPE_DARK_GREY};
    font-size: 20px;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};

    button {
        margin-top: 10px;
    }
`;

const StyledLottieAnimation = styled(LottieAnimation)`
    background: ${({ theme }) => theme.BG_GREY};
`;

const getMessageId = ({
    connected,
    showWarning,
    prerequisite,
}: {
    connected: boolean;
    showWarning: boolean;
    prerequisite?: PrerequisiteType;
}) => {
    switch (prerequisite) {
        case 'transport-bridge':
            return 'TR_TREZOR_BRIDGE_IS_NOT_RUNNING';
        case 'device-bootloader':
            return 'TR_DEVICE_CONNECTED_BOOTLOADER';
        default: {
            if (connected) {
                return !showWarning ? 'TR_DEVICE_CONNECTED' : 'TR_DEVICE_CONNECTED_WRONG_STATE';
            }

            return 'TR_CONNECT_YOUR_DEVICE';
        }
    }
};

interface ConnectDevicePromptProps {
    connected: boolean;
    showWarning: boolean;
    allowSwitchDevice?: boolean;
    prerequisite?: PrerequisiteType;
}

export const ConnectDevicePrompt = ({
    prerequisite,
    connected,
    showWarning,
    allowSwitchDevice,
}: ConnectDevicePromptProps) => {
    const dispatch = useDispatch();
    const theme = useTheme();
    const { device } = useDevice();

    const handleSwitchDeviceClick = () =>
        dispatch(goto('suite-switch-device', { params: { cancelable: true } }));

    return (
        <Wrapper
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: -0 }}
            transition={{ delay: 0.2, duration: 0.6, ease: motionEasing.enter }}
            data-test="@connect-device-prompt"
        >
            <ImageWrapper>
                <StyledLottieAnimation
                    type="CONNECT"
                    deviceModelInternal={device?.features?.internal_model}
                    loop={!connected}
                    shape="CIRCLE"
                    size={100}
                />

                <Checkmark>
                    {connected && !showWarning && (
                        <Icon icon="CHECK_ACTIVE" size={24} color={theme.TYPE_GREEN} />
                    )}

                    {showWarning && <Icon icon="WARNING" size={24} color={theme.TYPE_ORANGE} />}
                </Checkmark>
            </ImageWrapper>

            <Text>
                <Translation id={getMessageId({ connected, showWarning, prerequisite })} />

                {allowSwitchDevice && (
                    <Button variant="tertiary" onClick={handleSwitchDeviceClick}>
                        <Translation id="TR_SWITCH_DEVICE" />
                    </Button>
                )}
            </Text>
        </Wrapper>
    );
};
