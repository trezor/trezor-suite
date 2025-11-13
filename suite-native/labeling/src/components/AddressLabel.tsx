import { ReactNode } from 'react';
import { useSelector } from 'react-redux';

import { WithLabelingState, selectAddressLabel } from '@suite-common/suite-sync';
import { Text } from '@suite-native/atoms';
import type { StaticSessionId } from '@trezor/connect';

import { useIsLabelingEnabled } from './useIsLabelingEnabled';

type AddressLabelEProps = {
    address: string;
    deviceStaticSessionId: StaticSessionId;
    fallback: ReactNode;
};

export const AddressLabel = ({ address, deviceStaticSessionId, fallback }: AddressLabelEProps) => {
    const isLabelingEnabled = useIsLabelingEnabled();

    const label = useSelector((state: WithLabelingState) =>
        selectAddressLabel({
            state,
            address,
            deviceStaticSessionId,
        }),
    );

    if (!isLabelingEnabled || label === null) {
        return fallback;
    }

    return <Text>{label}</Text>;
};
