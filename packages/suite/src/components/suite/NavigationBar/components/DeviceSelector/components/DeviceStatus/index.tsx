import React from 'react';
import { Icon, colors, variables } from '@trezor/components';
import styled from 'styled-components';
import * as deviceUtils from '@suite-utils/device';
import { TrezorDevice } from '@suite-types';

type Status = 'connected' | 'disconnected' | 'warning';

const getStatusColor = (status: Status) => {
    const statusColors = {
        connected: colors.NEUE_TYPE_GREEN,
        disconnected: colors.NEUE_TYPE_RED,
        warning: colors.NEUE_TYPE_ORANGE,
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

const StatusText = styled.div<{ show: boolean; status: Status }>`
    /* display: ${props => (props.show ? 'flex' : 'none')}; */
    position: absolute;
    text-transform: uppercase;
    font-weight: ${variables.FONT_WEIGHT.DEMI_BOLD};
    font-size: ${variables.FONT_SIZE.TINY};
    top: 14px;
    color: ${props => getStatusColor(props.status)};
    opacity: ${props => (props.show ? 1 : 0)};
    right: ${props => (props.show ? '12px' : '4px')};
    transition: opacity 0.5s ease, right 0.5s ease;
`;

const IconWrapper = styled.div`
    display: flex;
    align-self: flex-start;
    margin-top: 4px;
`;

const StyledIcon = styled(Icon)`
    cursor: pointer;
`;

const OuterCircle = styled.div<{ show: boolean; status: Status }>`
    display: flex;
    justify-content: center;
    align-items: center;
    position: absolute;
    top: 12px;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: ${props => (props.status === 'connected' ? colors.NEUE_BG_LIGHT_GREEN : '#F6E2E2')};
    opacity: ${props => (props.show ? 1 : 0)};
    right: ${props => (props.show ? '12px' : '48px')};
    transition: opacity 0.5s ease, right 0.5s ease;
`;

const InnerCircle = styled.div<{ status: Status }>`
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: ${props => getStatusColor(props.status)};
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

    // if device needs attention and CTA func was passed show refresh button
    if (status === 'warning' && onRefreshClick) {
        return (
            <IconWrapper>
                <StyledIcon
                    onClick={(e: any) => {
                        e.stopPropagation();
                        onRefreshClick();
                    }}
                    icon="REFRESH"
                    size={16}
                    color={getStatusColor(status)}
                />
            </IconWrapper>
        );
    }

    // otherwise show dot icon (green/orange/red)
    return (
        <>
            <StatusText status={status} show={showTextStatus}>
                {status}
            </StatusText>
            <OuterCircle status={status} show={showIconStatus}>
                <InnerCircle status={status} />
            </OuterCircle>
        </>
    );
};

export default DeviceStatus;
