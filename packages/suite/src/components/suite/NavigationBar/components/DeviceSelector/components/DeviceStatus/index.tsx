import React from 'react';
import { Icon, variables, useTheme, SuiteThemeColors } from '@trezor/components';
import styled from 'styled-components';
import * as deviceUtils from '@suite-utils/device';
import { TrezorDevice } from '@suite-types';
import { Translation } from '@suite-components/Translation';
import StatusLight from '@suite-components/StatusLight';

type Status = 'connected' | 'disconnected' | 'warning';

const getStatusColor = (status: Status, theme: SuiteThemeColors) => {
    const statusColors = {
        connected: theme.TYPE_GREEN,
        disconnected: theme.TYPE_RED,
        warning: theme.TYPE_ORANGE,
    };

    return statusColors[status];
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

const StatusText = styled.div<{ show: boolean; status: Status }>`
    position: absolute;
    text-transform: uppercase;
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    font-size: ${variables.FONT_SIZE.TINY};
    top: 14px;
    color: ${props => getStatusColor(props.status, props.theme)};
    background: linear-gradient(
        90deg,
        ${props => `${props.theme.BG_LIGHT_GREY}00`} 0%,
        ${props => props.theme.BG_LIGHT_GREY} 20px,
        ${props => props.theme.BG_LIGHT_GREY} 100%
    );

    padding-left: 24px;
    opacity: ${props => (props.show ? 1 : 0)};
    right: ${props => (props.show ? '12px' : '4px')};
    transition: opacity 0.5s ease, right 0.5s ease;
`;

const IconWrapper = styled.div`
    display: flex;
    align-self: flex-start;
    margin-top: 4px;
`;

const StyledStatusLight = styled(StatusLight)<{ show: boolean }>`
    position: absolute;
    top: 12px;
    opacity: ${props => (props.show ? 1 : 0)};
    right: ${props => (props.show ? '12px' : '48px')};
    transition: opacity 0.5s ease, right 0.5s ease;
`;

interface Props {
    device: TrezorDevice;
    onRefreshClick?: () => void;
    showIconStatus?: boolean;
    showTextStatus?: boolean;
}

const DeviceStatus = ({
    device,
    onRefreshClick,
    showIconStatus = true,
    showTextStatus = false,
}: Props) => {
    const status = getStatusForDevice(device);
    const theme = useTheme();

    // if device needs attention and CTA func was passed show refresh button
    if (status === 'warning' && onRefreshClick) {
        return (
            <IconWrapper>
                <Icon
                    onClick={(e: any) => {
                        e.stopPropagation();
                        onRefreshClick();
                    }}
                    icon="REFRESH"
                    size={16}
                    color={getStatusColor(status, theme)}
                />
            </IconWrapper>
        );
    }

    const lightStatus = (
        {
            connected: 'ok',
            disconnected: 'error',
            warning: 'warning',
        } as const
    )[status];

    // otherwise show dot icon (green/orange/red)
    return (
        <>
            <StatusText status={status} show={showTextStatus}>
                {getTextForStatus(status)}
            </StatusText>
            <StyledStatusLight status={lightStatus} show={showIconStatus} />
        </>
    );
};

export default DeviceStatus;
