import { ReactNode } from 'react';
import { useSelector } from 'react-redux';

import { WithLabelingState, selectWalletLabel } from '@suite-common/suite-sync';
import type { StaticSessionId } from '@trezor/connect';

import { selectIsLabelingEnabled } from '../selectors';

type WalletLabelProps = {
    deviceStaticSessionId: StaticSessionId | undefined;
    fallbackLabel: ReactNode;
};

export const WalletLabel = ({ deviceStaticSessionId, fallbackLabel }: WalletLabelProps) => {
    const isLabelingEnabled = useSelector(selectIsLabelingEnabled);

    const label = useSelector((state: WithLabelingState) =>
        selectWalletLabel({ state, deviceStaticSessionId }),
    );

    return !isLabelingEnabled || label === null ? fallbackLabel : label;
};
