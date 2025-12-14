import { ReactNode } from 'react';
import { useSelector } from 'react-redux';

import { DeviceRootState, selectDeviceByStaticSessionId } from '@suite-common/wallet-core';
import type { StaticSessionId } from '@trezor/connect';

import { selectIsLabelingEnabled } from '../selectors';

type WalletLabelProps = {
    deviceStaticSessionId: StaticSessionId;
    fallbackLabel: ReactNode;
};

export const WalletLabel = ({ deviceStaticSessionId, fallbackLabel }: WalletLabelProps) => {
    const isLabelingEnabled = useSelector(selectIsLabelingEnabled);

    const deviceWallet = useSelector((state: DeviceRootState) =>
        selectDeviceByStaticSessionId(state, deviceStaticSessionId),
    );

    return !isLabelingEnabled || deviceWallet?.walletLabel === undefined
        ? fallbackLabel
        : deviceWallet.walletLabel;
};
