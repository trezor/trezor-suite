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
    device: TrezorDevice;
    forceConnectionInfo: boolean;
    deviceNeedsRefresh?: boolean;
};

export const DeviceStatusText = ({
    device,
    forceConnectionInfo,
    deviceNeedsRefresh,
}: DeviceStatusTextProps) => {
    const deviceStatus = deviceUtils.getStatus(device);
    const dispatch = useDispatch();
    if (deviceNeedsRefresh) {
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
