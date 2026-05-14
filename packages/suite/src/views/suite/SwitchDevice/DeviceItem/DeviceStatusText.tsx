import React from 'react';

import { Translation } from '@suite/intl';
import { type TrezorDevice } from '@suite-common/suite-types';
import * as deviceUtils from '@suite-common/suite-utils';

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
    if (deviceNeedsRefresh) {
        return (
            <DeviceConnectionText
                intent="warning"
                icon="repeat"
                data-testid="@deviceStatus-connected"
                data-testid-alt="@deviceStatus"
                isAction
            >
                <Translation id={getDeviceResolveStatusCTAMessage(deviceStatus)} />
            </DeviceConnectionText>
        );
    }

    return <DeviceStatusTextThp device={device} forceConnectionInfo={forceConnectionInfo} />;
};
