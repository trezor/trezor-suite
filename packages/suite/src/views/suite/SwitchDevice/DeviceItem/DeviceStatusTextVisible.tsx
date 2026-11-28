import React from 'react';

import { Translation } from '@suite/intl';
import { useWalletLabel } from '@suite/wallet';
import { type TrezorDevice } from '@suite-common/suite-types';
import * as deviceUtils from '@suite-common/suite-utils';
import { TOOLTIP_DELAY_LONG, TruncateWithTooltip } from '@trezor/components';
import { LinkBreakIcon, LinkIcon, LockIcon } from '@trezor/icons';

import { DeviceConnectionText } from './DeviceConnectionText';

type DeviceStatusTextVisibleProps = {
    device: TrezorDevice;
    forceConnectionInfo: boolean;
};

export const DeviceStatusTextVisible = ({
    device,
    forceConnectionInfo,
}: DeviceStatusTextVisibleProps) => {
    const { connected } = device;
    const { label } = useWalletLabel({ device });

    const deviceStatus = deviceUtils.getStatus(device);
    const isLocked =
        deviceStatus === 'device-pin-locked' ||
        deviceStatus === 'device-hard-locked' ||
        deviceStatus === 'device-bootloader-locked';

    // A locked device cannot be used even though it is connected, so "Connected" would mislead.
    if (isLocked) {
        return (
            <DeviceConnectionText
                intent="warning"
                icon={LockIcon}
                data-testid="@deviceStatus-locked"
                data-testid-alt="@deviceStatus"
            >
                <Translation id="TR_DEVICE_STATUS_LOCKED" />
            </DeviceConnectionText>
        );
    }

    return (
        <DeviceConnectionText
            intent={connected ? 'brand' : 'neutral'}
            priority={connected ? 'primary' : 'secondary'}
            icon={connected ? LinkIcon : LinkBreakIcon}
            data-testid={connected ? '@deviceStatus-connected' : '@deviceStatus-disconnected'}
            data-testid-alt="@deviceStatus"
        >
            {label && !forceConnectionInfo ? (
                <TruncateWithTooltip delayShow={TOOLTIP_DELAY_LONG}>{label}</TruncateWithTooltip>
            ) : (
                <Translation id={connected ? 'TR_CONNECTED' : 'TR_DISCONNECTED'} />
            )}
        </DeviceConnectionText>
    );
};
