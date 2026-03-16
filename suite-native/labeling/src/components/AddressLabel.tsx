import { type ReactNode } from 'react';
import { useSelector } from 'react-redux';

import { type SuiteSyncDataRootState, selectSuiteSyncAddressLabel } from '@suite-common/suite-sync';
import { Text, type TextProps } from '@suite-native/atoms';
import type { StaticSessionId } from '@trezor/connect';

import { selectIsLabellingAllowed } from '../selectors';

type AddressLabelProps = TextProps & {
    address: string;
    deviceStaticSessionId: StaticSessionId;
    fallback: ReactNode;
    maxLength?: number;
};

export const AddressLabel = ({
    address,
    deviceStaticSessionId,
    fallback,
    maxLength,
    ...textProps
}: AddressLabelProps) => {
    const isLabellingAllowed = useSelector(selectIsLabellingAllowed);

    const label = useSelector((state: SuiteSyncDataRootState) =>
        selectSuiteSyncAddressLabel(state, deviceStaticSessionId, address),
    );

    if (!isLabellingAllowed || label === null) {
        return fallback;
    }

    const truncatedLabel =
        maxLength && label.length > maxLength ? `${label.slice(0, maxLength)}…` : label;

    return (
        <Text numberOfLines={maxLength ? 0 : 1} {...textProps}>
            {truncatedLabel}
        </Text>
    );
};
