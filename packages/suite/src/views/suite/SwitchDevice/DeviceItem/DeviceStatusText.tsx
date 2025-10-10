import React from 'react';

import { TrezorDevice } from '@suite-common/suite-types';
import * as deviceUtils from '@suite-common/suite-utils';
import { acquireDevice } from '@suite-common/wallet-core';

import { Translation } from 'src/components/suite/Translation';

import { useDispatch } from '../../../../hooks/suite';
import { getDeviceResolveStatusCTAMessage } from '../getDeviceResolveStatusCTAMessage';
import { DeviceConnectionText } from './DeviceConnectionText';
import { DeviceStatusTextThp } from './DeviceStatusTextThp';

type DeviceStatusTextProps = {
    onRefreshClick?: (e: React.MouseEvent) => void;
    device: TrezorDevice;
    forceConnectionInfo: boolean;
};

export const DeviceStatusText = ({ device, forceConnectionInfo }: DeviceStatusTextProps) => {
    const { connected } = device;
    const deviceStatus = deviceUtils.getStatus(device);
    const dispatch = useDispatch();
    if (
        connected &&
        ['was-used-in-other-window', 'used-in-other-window', 'unacquired'].includes(deviceStatus)
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

    return <DeviceStatusTextThp device={device} forceConnectionInfo={forceConnectionInfo} />;
};
