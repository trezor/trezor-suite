import { ReactNode } from 'react';
import { useSelector } from 'react-redux';

import { SuiteSyncDataRootState, selectSuiteSyncWalletLabel } from '@suite-common/suite-sync';
import { parseDeviceStaticSessionId } from '@suite-common/wallet-utils';
import type { StaticSessionId } from '@trezor/connect';

import { selectIsLabelingEnabled } from '../selectors';

type WalletLabelProps = {
    deviceStaticSessionId: StaticSessionId | undefined;
    fallbackLabel: ReactNode;
};

export const WalletLabel = ({ deviceStaticSessionId, fallbackLabel }: WalletLabelProps) => {
    const isLabelingEnabled = useSelector(selectIsLabelingEnabled);

    const label = useSelector((state: SuiteSyncDataRootState) => {
        if (!deviceStaticSessionId) return null;
        const { walletDescriptor } = parseDeviceStaticSessionId(deviceStaticSessionId);

        return selectSuiteSyncWalletLabel(state, walletDescriptor);
    });

    return !isLabelingEnabled || label === null ? fallbackLabel : label;
};
