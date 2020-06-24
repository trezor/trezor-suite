import React from 'react';
import { Icon, colors } from '@trezor/components';
import styled from 'styled-components';
import * as deviceUtils from '@suite-utils/device';
import { TrezorDevice } from '@suite-types';

type Status = 'connected' | 'disconnected' | 'warning';

const getDotColor = (status: Status) => {
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

const IconWrapper = styled.div`
    display: flex;
    align-self: flex-start;
    margin-top: 4px;
`;

const StyledIcon = styled(Icon)`
    cursor: pointer;
`;
const OuterCircle = styled.div<{ status: Status }>`
    position: absolute;
    top: 12px;
    right: 12px;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: ${props =>
        props.status === 'connected' ? colors.NEUE_BG_LIGHT_GREEN : 'transparent'};
`;

const InnerCircle = styled.div<{ status: Status }>`
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: ${props => getDotColor(props.status)};
`;

interface Props {
    device: TrezorDevice;
    onRefreshClick?: () => void;
}

const DeviceStatus = ({ device, onRefreshClick }: Props) => {
    const status = getStatusForDevice(device);

    // if device needs attention and CTA func was passed show refresh button
    if (status === 'warning' && onRefreshClick) {
        return (
            <IconWrapper>
                <StyledIcon
                    onClick={e => {
                        e.stopPropagation();
                        onRefreshClick();
                    }}
                    icon="REFRESH"
                    size={16}
                    color={getDotColor(status)}
                />
            </IconWrapper>
        );
    }

    // otherwise show dot icon (green/orange/red)
    return (
        <OuterCircle status={status}>
            <InnerCircle status={status} />
        </OuterCircle>
    );
};

export default DeviceStatus;
