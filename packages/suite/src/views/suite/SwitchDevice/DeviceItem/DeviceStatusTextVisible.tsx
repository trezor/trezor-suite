import React from 'react';

import { Translation } from '@suite/intl';
import { selectLabelingDataForWallet } from '@suite/metadata';
import { selectSuiteSyncWalletLabel } from '@suite-common/suite-sync';
import { type TrezorDevice } from '@suite-common/suite-types';
import { parseDeviceStaticSessionId } from '@suite-common/wallet-utils';
import { TOOLTIP_DELAY_LONG, TruncateWithTooltip } from '@trezor/components';

import { useWalletLabeling } from 'src/components/suite/labeling/WalletLabeling';
import { useSelector } from 'src/hooks/suite';

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
    const { walletLabel: walletLabelOld } = useSelector(state =>
        selectLabelingDataForWallet(state, device.state),
    );

    const { defaultAccountLabelString } = useWalletLabeling();

    const defaultWalletLabel =
        device !== undefined ? defaultAccountLabelString({ device }) : undefined;

    const suiteSyncWalletLabel = useSelector(state => {
        if (!device?.state?.staticSessionId) return null;

        const { walletDescriptor } = parseDeviceStaticSessionId(device.state.staticSessionId);

        return selectSuiteSyncWalletLabel(state, walletDescriptor);
    });

    const walletLabel = suiteSyncWalletLabel ?? walletLabelOld;
    const isWalletLabelEmpty = walletLabel === undefined || walletLabel.trim() === '';
    const walletText = isWalletLabelEmpty ? defaultWalletLabel : walletLabel;

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
