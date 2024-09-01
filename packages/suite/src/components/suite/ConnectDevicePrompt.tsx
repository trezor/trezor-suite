import styled, { useTheme } from 'styled-components';

import {
    variables,
    Button,
    motionEasing,
    LottieAnimation,
    useElevation,
    ElevationUp,
    Icon,
} from '@trezor/components';
import { Translation } from 'src/components/suite';
import { useDevice, useDispatch } from 'src/hooks/suite';
import { goto } from 'src/actions/suite/routerActions';
import type { PrerequisiteType } from 'src/types/suite';
import { motion } from 'framer-motion';
import { Elevation, mapElevationToBackground, mapElevationToBorder } from '@trezor/theme';

const Wrapper = styled(motion.div)<{ $elevation: Elevation }>`
    display: flex;
    height: 122px;
    min-height: 122px;
    width: 360px;
    border-radius: 61px;
    padding: 10px;
    background: ${mapElevationToBackground};
    border: 1px solid ${mapElevationToBorder};
    align-items: center;
    box-shadow: ${({ theme }) => theme.boxShadowElevated};
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
    color: ${({ theme }) => theme.legacy.TYPE_DARK_GREY};
    font-size: 20px;
    font-weight: ${variables.FONT_WEIGHT.MEDIUM};

    button {
        margin-top: 10px;
    }
`;

// eslint-disable-next-line local-rules/no-override-ds-component
const StyledLottieAnimation = styled(LottieAnimation)<{ $elevation: Elevation }>`
    background: ${mapElevationToBackground};
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
            return 'TR_NO_TRANSPORT';
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

const ConnectImage = ({
    connected,
    showWarning,
}: Pick<ConnectDevicePromptProps, 'connected' | 'showWarning'>) => {
    const theme = useTheme();
    const { device } = useDevice();
    const { elevation } = useElevation();

    return (
        <ImageWrapper>
            <StyledLottieAnimation
                $elevation={elevation}
                type="CONNECT"
                deviceModelInternal={device?.features?.internal_model}
                loop={!connected}
                shape="CIRCLE"
                size={100}
            />

            <Checkmark>
                {connected && !showWarning && (
                    <Icon name="checkActive" size={24} color={theme.legacy.TYPE_GREEN} />
                )}

                {showWarning && (
                    <Icon name="warningTriangle" size={24} color={theme.legacy.TYPE_ORANGE} />
                )}
            </Checkmark>
        </ImageWrapper>
    );
};

export const ConnectDevicePrompt = ({
    prerequisite,
    connected,
    showWarning,
    allowSwitchDevice,
}: ConnectDevicePromptProps) => {
    const dispatch = useDispatch();

    const { elevation } = useElevation();

    const handleSwitchDeviceClick = () =>
        dispatch(goto('suite-switch-device', { params: { cancelable: true } }));

    return (
        <Wrapper
            $elevation={elevation}
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: -0 }}
            transition={{ delay: 0.2, duration: 0.6, ease: motionEasing.enter }}
            data-testid="@connect-device-prompt"
        >
            <ElevationUp>
                <ConnectImage connected={connected} showWarning={showWarning} />

                <Text>
                    <Translation id={getMessageId({ connected, showWarning, prerequisite })} />

                    {allowSwitchDevice && (
                        <Button variant="tertiary" onClick={handleSwitchDeviceClick}>
                            <Translation id="TR_SWITCH_DEVICE" />
                        </Button>
                    )}
                </Text>
            </ElevationUp>
        </Wrapper>
    );
};
