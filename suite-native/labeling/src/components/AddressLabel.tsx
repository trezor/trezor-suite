import { ReactNode } from 'react';
import { useSelector } from 'react-redux';

import { SuiteSyncDataRootState, selectSuiteSyncAddressLabel } from '@suite-common/suite-sync';
import { Text } from '@suite-native/atoms';
import type { StaticSessionId } from '@trezor/connect';

import { selectSuiteSyncLabelingEnabled } from '../selectors';

type AddressLabelEProps = {
    address: string;
    deviceStaticSessionId: StaticSessionId;
    fallback: ReactNode;
};

export const AddressLabel = ({ address, deviceStaticSessionId, fallback }: AddressLabelEProps) => {
    const isLabelingEnabled = useSelector(selectSuiteSyncLabelingEnabled);

    const label = useSelector((state: SuiteSyncDataRootState) =>
        selectSuiteSyncAddressLabel(state, deviceStaticSessionId, address),
    );

    if (!isLabelingEnabled || label === null) {
        return fallback;
    }

    return <Text>{label}</Text>;
};
