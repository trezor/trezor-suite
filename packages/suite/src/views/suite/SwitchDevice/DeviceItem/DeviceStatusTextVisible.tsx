import React from 'react';

import { selectWalletLabel } from '@suite-common/suite-sync';
import { TrezorDevice } from '@suite-common/suite-types';
import { TOOLTIP_DELAY_LONG, TruncateWithTooltip } from '@trezor/components';

import { Translation } from 'src/components/suite/Translation';
import { useWalletLabeling } from 'src/components/suite/labeling/WalletLabeling';
import { useSelector } from 'src/hooks/suite';
import { selectLabelingDataForWallet } from 'src/reducers/suite/metadataReducer';

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

    const suiteSyncWalletLabel = useSelector(state =>
        selectWalletLabel({ state, deviceStaticSessionId: device?.state?.staticSessionId }),
    );

    const walletLabel = suiteSyncWalletLabel ?? walletLabelOld;
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
