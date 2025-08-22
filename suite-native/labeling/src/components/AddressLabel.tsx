import { useSelector } from 'react-redux';

import { WithLabelingState, selectAddressLabel } from '@suite-common/local-first-storage';
import { Text } from '@suite-native/atoms';
import type { StaticSessionId } from '@trezor/connect';

import { useIsLabelingEnabled } from './useIsLabelingEnabled';

type AddressLabelEProps = {
    address: string;
    deviceStaticSessionId: StaticSessionId;
};

export const AddressLabel = ({ address, deviceStaticSessionId }: AddressLabelEProps) => {
    const isLabelingEnabled = useIsLabelingEnabled();

    const label = useSelector(
        (state: WithLabelingState) =>
            (address !== undefined
                ? selectAddressLabel({
                      state,
                      address,
                      deviceStaticSessionId,
                  })
                : null
            )?.label ?? null,
    );

    if (!isLabelingEnabled) {
        return null;
    }

    return <Text>{label}</Text>;
};
