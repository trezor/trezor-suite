import { type ReactNode } from 'react';
import { useSelector } from 'react-redux';

import { type SuiteSyncDataRootState, selectSuiteSyncWalletLabel } from '@suite-common/suite-sync';
import { selectIsLabellingAllowed } from '@suite-native/labeling';
import type { StaticSessionId } from '@trezor/connect';
import { parseStaticSessionId } from '@trezor/device-utils';

type WalletLabelProps = {
    deviceStaticSessionId: StaticSessionId | undefined;
    fallbackLabel: ReactNode;
};

export const WalletLabel = ({ deviceStaticSessionId, fallbackLabel }: WalletLabelProps) => {
    const isLabellingAllowed = useSelector(selectIsLabellingAllowed);

    const label = useSelector((state: SuiteSyncDataRootState) => {
        if (!deviceStaticSessionId) return null;
        const { walletDescriptor } = parseStaticSessionId(deviceStaticSessionId);

        return selectSuiteSyncWalletLabel(state, walletDescriptor);
    });

    return !isLabellingAllowed || label === null ? fallbackLabel : label;
};
