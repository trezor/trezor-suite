import { ReactNode } from 'react';
import { useSelector } from 'react-redux';

import { AccountsRootState, selectAccountAddressLabel } from '@suite-common/wallet-core';
import { AccountKey } from '@suite-common/wallet-types';
import { Text } from '@suite-native/atoms';

import { selectIsLabelingEnabled } from '../selectors';

type AddressLabelEProps = {
    address: string;
    accountKey: AccountKey;
    fallback: ReactNode;
};

export const AddressLabel = ({ address, accountKey, fallback }: AddressLabelEProps) => {
    const isLabelingEnabled = useSelector(selectIsLabelingEnabled);

    const label = useSelector((state: AccountsRootState) =>
        selectAccountAddressLabel(state, accountKey, address),
    );

    if (!isLabelingEnabled || label === null) {
        return fallback;
    }

    return <Text>{label}</Text>;
};
