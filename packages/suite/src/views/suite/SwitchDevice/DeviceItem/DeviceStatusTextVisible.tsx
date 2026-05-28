import React from 'react';

import { Translation } from '@suite/intl';
import { useGetWalletLabel } from '@suite/wallet';
import { type TrezorDevice } from '@suite-common/suite-types';
import { TOOLTIP_DELAY_LONG, TruncateWithTooltip } from '@trezor/components';

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
    const walletText = useGetWalletLabel({ device });

    return (
        <DeviceConnectionText
            intent={connected ? 'brand' : 'neutral'}
            priority={connected ? 'primary' : 'secondary'}
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
