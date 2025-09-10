import { motion } from 'framer-motion';
import styled, { useTheme } from 'styled-components';

import { DEFAULT_FLAGSHIP_MODEL } from '@suite-common/suite-constants';
import { ConnectedDeviceStatus } from '@suite-common/suite-utils';
import { selectSelectedDevice } from '@suite-common/wallet-core';
import {
    Box,
    Column,
    ComponentWithSubIcon,
    ElevationUp,
    Icon,
    IconVariant,
    Text,
    iconSizes,
    motionEasing,
    useElevation,
    variables,
} from '@trezor/components';
import { isDesktop } from '@trezor/env-utils';
import { DeviceWithScene } from '@trezor/product-components';
import { Elevation, spacings, spacingsPx, typography } from '@trezor/theme';

import { Translation } from 'src/components/suite';
import type { PrerequisiteType } from 'src/types/suite';

import { TranslationKey } from './Translation';
import { useSelector } from '../../hooks/suite';

const Wrapper = styled(motion.div)<{ $elevation: Elevation }>`
    display: flex;
    flex-direction: column;

    padding: 10px;
    align-items: center;

    ${variables.SCREEN_QUERY.ABOVE_MOBILE} {
        border-radius: 61px;
    }
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
    prerequisite: PrerequisiteType | null;
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

    if (prerequisite === null) {
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
    prerequisite: PrerequisiteType | null;
    deviceStatus: ConnectedDeviceStatus | null;
}

const ConnectImage = ({
    connected,
    showWarningIcon,
}: Pick<ConnectDevicePromptProps, 'connected' | 'showWarningIcon'>) => {
    const theme = useTheme();
    const selectedDevice = useSelector(selectSelectedDevice);
    const selectedDeviceModelInternal =
        selectedDevice?.features?.internal_model || DEFAULT_FLAGSHIP_MODEL;

    const getIconData = (): { variant: IconVariant; icon: React.ReactNode } | undefined => {
        const commonProps = {
            color: theme.iconDefaultInverted,
            size: iconSizes.mediumLarge,
        };

        if (connected && !showWarningIcon) {
            return {
                variant: 'primary',
                icon: <Icon name="check" {...commonProps} />,
            };
        }
        if (showWarningIcon) {
            return {
                variant: 'warning',
                icon: <Icon name="warningFilled" {...commonProps} />,
            };
        }

        return undefined;
    };

    const iconData = getIconData();

    return (
        <Box position={{ type: 'relative' }}>
            <ComponentWithSubIcon
                variant={iconData?.variant ?? 'tertiary'}
                icon={iconData?.icon}
                iconPadding={spacings.xxs}
                iconOffset={spacings.xs}
            >
                <DeviceWithScene
                    deviceModel={selectedDeviceModelInternal}
                    unitColor={selectedDevice?.features?.unit_color}
                />
            </ComponentWithSubIcon>
        </Box>
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
            <Column alignItems="center" gap={spacings.sm}>
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
