import React from 'react';

import { Translation } from '@suite/intl';
import { useWalletLabel } from '@suite/wallet';
import { type TrezorDevice } from '@suite-common/suite-types';
import { TOOLTIP_DELAY_LONG, TruncateWithTooltip } from '@trezor/components';
import { LinkBreakIcon, LinkIcon } from '@trezor/icons';

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
