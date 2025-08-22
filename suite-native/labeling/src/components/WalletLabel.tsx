import { ReactNode } from 'react';
import { useSelector } from 'react-redux';

import { WithLabelingState, selectWalletLabel } from '@suite-common/local-first-storage';
import { Text } from '@suite-native/atoms';
import type { StaticSessionId } from '@trezor/connect';

import { useIsLabelingEnabled } from './useIsLabelingEnabled';

type WalletLabelProps = {
    deviceStaticSessionId: StaticSessionId | undefined;
    fallbackLabel: ReactNode;
};

export const WalletLabel = ({ deviceStaticSessionId, fallbackLabel }: WalletLabelProps) => {
    const isLabelingEnabled = useIsLabelingEnabled();

    const label = useSelector((state: WithLabelingState) =>
        selectWalletLabel({ state, deviceStaticSessionId }),
    );

    return <Text>{!isLabelingEnabled || label === null ? fallbackLabel : label}</Text>;
};
