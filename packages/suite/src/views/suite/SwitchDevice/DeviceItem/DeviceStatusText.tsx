import * as deviceUtils from '@suite-common/suite-utils';
import { TOOLTIP_DELAY_LONG, TruncateWithTooltip } from '@trezor/components';
import React, { MouseEventHandler } from 'react';
import { Translation } from 'src/components/suite';
import { DeviceConnectionText } from './DeviceConnectionText';
import { selectLabelingDataForWallet } from 'src/reducers/suite/metadataReducer';
import { useSelector } from 'src/hooks/suite';
import { useWalletLabeling } from 'src/components/suite/labeling/WalletLabeling';
import { TrezorDevice } from '@suite-common/suite-types';

type DeviceStatusTextProps = {
    onRefreshClick?: MouseEventHandler;
    device: TrezorDevice;
    forceConnectionInfo: boolean;
};

type DeviceStatusVisible = {
    connected: boolean;
    device: TrezorDevice;
    forceConnectionInfo: boolean;
};

const DeviceStatusVisible = ({ device, connected, forceConnectionInfo }: DeviceStatusVisible) => {
    const { walletLabel } = useSelector(state => selectLabelingDataForWallet(state, device.state));

    const { defaultAccountLabelString } = useWalletLabeling();

    const defaultWalletLabel =
        device !== undefined ? defaultAccountLabelString({ device }) : undefined;
    const isWalletLabelEmpty = walletLabel === undefined || walletLabel.trim() === '';

    const walletText = isWalletLabelEmpty ? defaultWalletLabel : walletLabel;

    return (
        <DeviceConnectionText
            variant={connected ? 'primary' : 'tertiary'}
            icon={connected ? 'LINK' : 'UNLINK'}
            data-testid={connected ? '@deviceStatus-connected' : '@deviceStatus-disconnected'}
        >
            {walletText && !forceConnectionInfo ? (
                <TruncateWithTooltip delayShow={TOOLTIP_DELAY_LONG}>
                    {walletText}
                </TruncateWithTooltip>
            ) : (
                <Translation id={connected ? 'TR_CONNECTED' : 'TR_DISCONNECTED'} />
            )}
        </DeviceConnectionText>
    );
};

export const DeviceStatusText = ({
    onRefreshClick,
    device,
    forceConnectionInfo,
}: DeviceStatusTextProps) => {
    const { connected } = device;
    const deviceStatus = deviceUtils.getStatus(device);
    const needsAttention = deviceUtils.deviceNeedsAttention(deviceStatus);

    if (connected && needsAttention && onRefreshClick) {
        return (
            <DeviceConnectionText
                variant="warning"
                icon="REFRESH"
                data-testid={connected ? '@deviceStatus-connected' : '@deviceStatus-disconnected'}
                isAction
            >
                <Translation id="TR_SOLVE_ISSUE" />
            </DeviceConnectionText>
        );
    }

    return (
        <DeviceStatusVisible
            connected={connected}
            device={device}
            forceConnectionInfo={forceConnectionInfo}
        />
    );
};
