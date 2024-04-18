import { TrezorDevice } from '@suite-common/suite-types';
import * as deviceUtils from '@suite-common/suite-utils';
import { TOOLTIP_DELAY_LONG, TruncateWithTooltip } from '@trezor/components';
import React, { MouseEventHandler } from 'react';
import { Translation, WalletLabeling, useGetWalletLabel } from 'src/components/suite';
import { DeviceConnectionText } from './DeviceConnectionText';

type DeviceStatusTextProps = {
    device: TrezorDevice;
    onRefreshClick?: MouseEventHandler;
    walletLabel?: string;
};

type DeviceStatusVisible = {
    connected: boolean;
    walletLabel?: string;
    device: TrezorDevice;
};

const DeviceStatusVisible = ({ connected, walletLabel, device }: DeviceStatusVisible) => (
    <DeviceConnectionText
        variant={connected ? 'primary' : 'tertiary'}
        icon={connected ? 'LINK' : 'UNLINK'}
        data-test={connected ? '@deviceStatus-connected' : '@deviceStatus-disconnected'}
    >
        {walletLabel ? (
            <TruncateWithTooltip delayShow={TOOLTIP_DELAY_LONG}>
                <WalletLabeling device={device} />
            </TruncateWithTooltip>
        ) : (
            <Translation id={connected ? 'TR_CONNECTED' : 'TR_DISCONNECTED'} />
        )}
    </DeviceConnectionText>
);

export const DeviceStatusText = ({
    device,
    onRefreshClick,
    walletLabel,
}: DeviceStatusTextProps) => {
    const { connected } = device;
    const deviceStatus = deviceUtils.getStatus(device);
    const needsAttention = deviceUtils.deviceNeedsAttention(deviceStatus);
    const isDeviceStatusVisible = Boolean(useGetWalletLabel({ device }));

    if (connected && needsAttention && onRefreshClick) {
        return (
            <DeviceConnectionText
                variant="warning"
                icon={'REFRESH'}
                data-test={connected ? '@deviceStatus-connected' : '@deviceStatus-disconnected'}
                isAction
            >
                <Translation id="TR_SOLVE_ISSUE" />
            </DeviceConnectionText>
        );
    }

    return isDeviceStatusVisible ? (
        <DeviceStatusVisible connected={connected} walletLabel={walletLabel} device={device} />
    ) : null;
};
