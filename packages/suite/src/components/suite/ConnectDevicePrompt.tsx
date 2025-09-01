import { motion } from 'framer-motion';
import styled, { useTheme } from 'styled-components';

import { ConnectedDeviceStatus, getDeviceInternalModel } from '@suite-common/suite-utils';
import {
    Column,
    ElevationUp,
    Icon,
    LottieAnimation,
    Text,
    motionEasing,
    useElevation,
    variables,
} from '@trezor/components';
import { isDesktop } from '@trezor/env-utils';
import {
    Elevation,
    mapElevationToBackground,
    spacings,
    spacingsPx,
    typography,
} from '@trezor/theme';

import { Translation } from 'src/components/suite';
import { useDevice } from 'src/hooks/suite';
import type { PrerequisiteType } from 'src/types/suite';

import { TranslationKey } from './Translation';

const Wrapper = styled(motion.div)<{ $elevation: Elevation }>`
    display: flex;
    flex-direction: column;

    padding: 10px;
    align-items: center;
    margin: 0;

    ${variables.SCREEN_QUERY.ABOVE_MOBILE} {
        border-radius: 61px;
    }
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

const HeadingText = styled.div`
    display: flex;
    flex-direction: column;
    text-align: center;

    ${typography.titleMedium}
    ${variables.SCREEN_QUERY.ABOVE_MOBILE} {
        margin: 0 ${spacingsPx.xl} 0 ${spacingsPx.xs};
    }

    button {
        margin-top: 10px;
    }
`;

// eslint-disable-next-line local-rules/no-override-ds-component
const StyledLottieAnimation = styled(LottieAnimation)<{ $elevation: Elevation }>`
    background: ${mapElevationToBackground};
`;

const getWarningMessage = ({
    deviceStatus,
    showWarning,
}: {
    deviceStatus: ConnectedDeviceStatus | null;
    showWarning: boolean;
}) => {
    switch (deviceStatus) {
        case 'bootloader':
            return 'TR_DEVICE_CONNECTED_NEW_DEVICE_STATE';
        case 'initialize':
            return 'TR_DEVICE_CONNECTED_INITIAL_DEVICE_STATE';
        default:
            return showWarning ? 'TR_DEVICE_CONNECTED' : 'TR_DEVICE_CONNECTED_WRONG_STATE';
    }
};

type GetMessageIdParams = {
    connected: boolean;
    deviceStatus: ConnectedDeviceStatus | null;
    showWarning: boolean;
    prerequisite?: PrerequisiteType;
};

const getMessageId = ({
    connected,
    deviceStatus,
    showWarning,
    prerequisite,
}: GetMessageIdParams): {
    heading: TranslationKey;
    description?: TranslationKey;
} => {
    const getDefaultKey = (): {
        heading: TranslationKey;
        description?: TranslationKey;
    } => {
        if (connected) {
            return {
                heading: getWarningMessage({ deviceStatus, showWarning }),
            };
        }

        return {
            heading: 'TR_CONNECT_YOUR_DEVICE',
            description: 'TR_CONNECT_DEVICE_DESCRIPTION',
        };
    };

    const defaultKey = getDefaultKey();

    if (prerequisite === undefined) {
        return defaultKey;
    }

    const map: Record<
        PrerequisiteType,
        {
            heading: TranslationKey;
            description?: TranslationKey;
        }
    > = {
        'no-transport': {
            heading: isDesktop() ? 'TR_NO_TRANSPORT_DESKTOP' : 'TR_NO_TRANSPORT',
        },
        'device-bootloader': {
            heading: 'TR_DEVICE_CONNECTED_BOOTLOADER',
        },
        'device-used-elsewhere': {
            heading: 'TR_DEVICE_CONNECTED_UNACQUIRED',
        },
        'device-unacquired': {
            heading: 'TR_NEEDS_ATTENTION_UNABLE_TO_CONNECT',
        },
        'device-unacquired-requires-thp': {
            heading: 'TR_NEEDS_TREZOR_HOST_PROTOCOL_PAIRING',
        },

        'device-disconnect-required': defaultKey,
        'device-disconnected': defaultKey,
        'device-initialize': defaultKey,
        'device-recovery-mode': defaultKey,
        'device-seedless': defaultKey,
        'device-unknown': defaultKey,
        'device-unreadable': defaultKey,
        'firmware-missing': defaultKey,
        'firmware-required': defaultKey,
        'multi-share-backup-in-progress': defaultKey,
    };

    return map[prerequisite];
};

interface ConnectDevicePromptProps {
    connected: boolean;
    showWarning?: boolean;
    showWarningIcon: boolean;
    allowSwitchDevice?: boolean;
    prerequisite?: PrerequisiteType;
    deviceStatus: ConnectedDeviceStatus | null;
}

const ConnectImage = ({
    connected,
    showWarningIcon,
}: Pick<ConnectDevicePromptProps, 'connected' | 'showWarningIcon'>) => {
    const theme = useTheme();
    const { device } = useDevice();
    const { elevation } = useElevation();

    return (
        <ImageWrapper>
            <StyledLottieAnimation
                $elevation={elevation}
                type="CONNECT"
                deviceModelInternal={
                    device !== undefined ? getDeviceInternalModel(device) : undefined
                }
                loop={!connected}
                shape="CIRCLE"
                size={100}
            />

            <Checkmark>
                {connected && !showWarningIcon && (
                    <Icon name="checkCircleFilled" size={24} color={theme.legacy.TYPE_GREEN} />
                )}

                {showWarningIcon && (
                    <Icon name="warning" size={24} color={theme.legacy.TYPE_ORANGE} />
                )}
            </Checkmark>
        </ImageWrapper>
    );
};

export const ConnectDevicePrompt = ({
    prerequisite,
    deviceStatus,
    connected,
    showWarning,
    showWarningIcon,
}: ConnectDevicePromptProps) => {
    const { elevation } = useElevation();

    const texts = getMessageId({
        connected,
        showWarning: showWarningIcon ?? showWarning,
        deviceStatus,
        prerequisite,
    });

    return (
        <Wrapper
            $elevation={elevation}
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: -0 }}
            transition={{ delay: 0.2, duration: 0.6, ease: motionEasing.enter }}
            data-testid="@connect-device-prompt"
        >
            <Column gap={spacings.sm}>
                <Column alignItems="center" gap={spacings.xxl}>
                    <ElevationUp>
                        <ConnectImage
                            connected={connected}
                            showWarningIcon={showWarningIcon ?? showWarning}
                        />

                        <HeadingText>
                            <Translation id={texts.heading} />
                        </HeadingText>
                    </ElevationUp>
                </Column>
                {texts.description && (
                    <Text variant="tertiary">
                        <Translation id={texts.description} />
                    </Text>
                )}
            </Column>
        </Wrapper>
    );
};
