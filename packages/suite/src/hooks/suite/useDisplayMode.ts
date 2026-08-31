import { selectSelectedAccount } from '@suite/account';
import { selectDeviceUnavailableCapabilities } from '@suite-common/device';
import { useSelector } from '@suite-common/redux-utils';
import { selectAddressDisplayType } from '@suite-common/wallet-core';
import {
    AddressDisplayOptions,
    type ReviewOutput,
    type StakeType,
} from '@suite-common/wallet-types';

import { DisplayMode } from 'src/types/suite';

type UseDisplayModeProps = {
    type: ReviewOutput['type'];
    stakeType?: StakeType;
};

export const useDisplayMode = ({ type, stakeType }: UseDisplayModeProps) => {
    const account = useSelector(selectSelectedAccount);
    const unavailableCapabilities = useSelector(selectDeviceUnavailableCapabilities);
    const addressDisplayType = useSelector(selectAddressDisplayType);

    if (stakeType || ['data', 'opreturn'].includes(type)) {
        return DisplayMode.SINGLE_WRAPPED_TEXT;
    }

    if (
        addressDisplayType === AddressDisplayOptions.CHUNKED &&
        !unavailableCapabilities?.chunkify &&
        account?.networkType !== 'cardano'
    ) {
        return DisplayMode.CHUNKS;
    }

    return DisplayMode.PAGINATED_TEXT;
};
