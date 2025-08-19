import { useSelector } from 'react-redux';

import { WithLabelingState, selectAddressLabel } from '@suite-common/local-first-storage';
import { Text } from '@suite-native/atoms';
import type { StaticSessionId } from '@trezor/connect';

type AddressLabelEProps = {
    address: string;
    deviceStaticSessionId: StaticSessionId;
};

export const AddressLabel = ({ address, deviceStaticSessionId }: AddressLabelEProps) => {
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

    return <Text>{label}</Text>;
};
