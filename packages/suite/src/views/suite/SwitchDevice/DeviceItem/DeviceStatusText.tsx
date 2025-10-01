import React from 'react';

import { selectWalletLabel } from '@suite-common/local-first-storage';
import { TrezorDevice } from '@suite-common/suite-types';
import * as deviceUtils from '@suite-common/suite-utils';
import { acquireDevice } from '@suite-common/wallet-core';
import { TOOLTIP_DELAY_LONG, TruncateWithTooltip } from '@trezor/components';

import { Translation } from 'src/components/suite/Translation';
import { useWalletLabeling } from 'src/components/suite/labeling/WalletLabeling';
import { useSelector } from 'src/hooks/suite';
import { selectLabelingDataForWallet } from 'src/reducers/suite/metadataReducer';

import { DeviceConnectionText } from './DeviceConnectionText';
import { useDispatch } from '../../../../hooks/suite';
import { getDeviceResolveStatusCTAMessage } from '../getDeviceResolveStatusCTAMessage';

type DeviceStatusTextProps = {
    onRefreshClick?: (e: React.MouseEvent) => void;
    device: TrezorDevice;
    forceConnectionInfo: boolean;
};

type DeviceStatusVisible = {
    connected: boolean;
    device: TrezorDevice;
    forceConnectionInfo: boolean;
};

const DeviceStatusVisible = ({ device, connected, forceConnectionInfo }: DeviceStatusVisible) => {
    const { walletLabel: walletLabelOld } = useSelector(state =>
        selectLabelingDataForWallet(state, device.state),
    );

    const { defaultAccountLabelString } = useWalletLabeling();

    const defaultWalletLabel =
        device !== undefined ? defaultAccountLabelString({ device }) : undefined;

    const localFirstWalletLabel = useSelector(state =>
        selectWalletLabel({ state, deviceStaticSessionId: device?.state?.staticSessionId }),
    );

    const walletLabel = localFirstWalletLabel ?? walletLabelOld;
    const isWalletLabelEmpty = walletLabel === undefined || walletLabel.trim() === '';
    const walletText = isWalletLabelEmpty ? defaultWalletLabel : walletLabel;

    return (
        <DeviceConnectionText
            variant={connected ? 'primary' : 'tertiary'}
            icon={connected ? 'link' : 'linkBreak'}
            data-testid={connected ? '@deviceStatus-connected' : '@deviceStatus-disconnected'}
            data-testid-alt="@deviceStatus"
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

export const DeviceStatusText = ({ device, forceConnectionInfo }: DeviceStatusTextProps) => {
    const { connected } = device;
    const deviceStatus = deviceUtils.getStatus(device);
    const dispatch = useDispatch();
    if (
        connected &&
        ['was-used-in-other-window', 'used-in-other-window', 'unavailable'].includes(deviceStatus)
    ) {
        return (
            <DeviceConnectionText
                variant="warning"
                icon="repeat"
                data-testid="@deviceStatus-connected"
                data-testid-alt="@deviceStatus"
                isAction
                onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();

                    dispatch(
                        acquireDevice({
                            requestedDevice: device,
                        }),
                    );
                }}
            >
                <Translation id={getDeviceResolveStatusCTAMessage(deviceStatus)} />
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
