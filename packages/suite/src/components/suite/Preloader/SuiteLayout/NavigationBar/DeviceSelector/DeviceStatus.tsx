import styled from 'styled-components';

import * as deviceUtils from '@suite-common/suite-utils';
import { Icon, variables, useTheme, SuiteThemeColors } from '@trezor/components';

import { TrezorDevice } from 'src/types/suite';
import { Translation } from 'src/components/suite/Translation';
import { StatusLight } from 'src/components/suite';

type Status = 'connected' | 'disconnected' | 'warning';

const getStatusColor = (status: Status, theme: SuiteThemeColors) => {
    const statusColors = {
        connected: theme.TYPE_GREEN,
        disconnected: theme.TYPE_RED,
        warning: theme.TYPE_ORANGE,
    };

    return statusColors[status];
};

const getStatusBackgroundColor = (status: Status, theme: SuiteThemeColors) => {
    const statusBackgroundColors = {
        connected: theme.BG_LIGHT_GREEN,
        disconnected: theme.BG_LIGHT_RED,
        warning: theme.TYPE_LIGHT_ORANGE,
    };

    return statusBackgroundColors[status];
};

const getStatusForDevice = (device: TrezorDevice) => {
    const deviceStatus = deviceUtils.getStatus(device);
    const needsAttention = deviceUtils.deviceNeedsAttention(deviceStatus);

    if (!device.connected) {
        return 'disconnected';
    }

    if (needsAttention) {
        return 'warning';
    }

    return 'connected';
};

const getTextForStatus = (status: 'connected' | 'disconnected' | 'warning') => {
    switch (status) {
        case 'connected':
            return <Translation id="TR_CONNECTED" />;
        case 'disconnected':
            return <Translation id="TR_DISCONNECTED" />;
        case 'warning':
        default:
            return <Translation id="TR_WARNING" />;
    }
};

const StatusText = styled.div<{ isShown: boolean; status: Status }>`
    position: absolute;
    top: 5px;
    right: ${({ isShown }) => (isShown ? '6px' : '-10px')};
    padding: 3px 6px 2px 24px;
    border-radius: 6px;
    background: linear-gradient(
        90deg,
        ${({ theme, status }) => `${getStatusBackgroundColor(status, theme)}00`} 0%,
        ${({ theme, status }) => getStatusBackgroundColor(status, theme)} 20px,
        ${({ theme, status }) => getStatusBackgroundColor(status, theme)} 100%
    );
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    font-size: ${variables.FONT_SIZE.TINY};
    color: ${({ status, theme }) => getStatusColor(status, theme)};
    text-transform: uppercase;
    opacity: ${({ isShown }) => (isShown ? 1 : 0)};
    transition: opacity 0.5s ease, right 0.5s ease;
`;

const RefreshIcon = styled(Icon)`
    transition: transform 0.2s ease-out;

    :hover {
        transform: rotate(20deg);
    }
`;

const StyledStatusLight = styled(StatusLight)<{ isShown: boolean }>`
    top: 12px;
    right: ${({ isShown }) => (isShown ? '12px' : '48px')};
    opacity: ${({ isShown }) => (isShown ? 1 : 0)};
    transition: opacity 0.5s ease, right 0.5s ease;
`;

interface DeviceStatusProps {
    device: TrezorDevice;
    onRefreshClick?: () => void;
    showTextStatus?: boolean;
}

export const DeviceStatus = ({
    device,
    onRefreshClick,
    showTextStatus = false,
}: DeviceStatusProps) => {
    const status = getStatusForDevice(device);
    const theme = useTheme();

    const lightStatuses = {
        connected: 'ok',
        disconnected: 'error',
        warning: 'warning',
    } as const;

    // if device needs attention and CTA func was passed show refresh button
    if (status === 'warning' && onRefreshClick) {
        return (
            <RefreshIcon
                onClick={(e: any) => {
                    e.stopPropagation();
                    onRefreshClick();
                }}
                icon="REFRESH"
                size={12}
                color={getStatusColor(status, theme)}
            />
        );
    }

    // otherwise show dot icon (green/orange/red)
    return (
        <>
            <StatusText
                status={status}
                data-test={`@deviceStatus-${status}`}
                isShown={showTextStatus}
            >
                {getTextForStatus(status)}
            </StatusText>

            <StyledStatusLight status={lightStatuses[status]} isShown={!showTextStatus} />
        </>
    );
};
