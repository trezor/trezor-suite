import { selectDeviceUnavailableCapabilities } from '@suite-common/wallet-core';
import { AddressDisplayOptions, StakeType, ReviewOutput } from '@suite-common/wallet-types';

import { selectAddressDisplayType } from 'src/reducers/suite/suiteReducer';
import { selectSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';
import { useSelector } from './useSelector';
import { DisplayMode } from 'src/types/suite';

type UseDisplayModeProps = {
    type: ReviewOutput['type'];
    ethereumStakeType?: StakeType;
};

export const useDisplayMode = ({ type, ethereumStakeType }: UseDisplayModeProps) => {
    const account = useSelector(selectSelectedAccount);
    const unavailableCapabilities = useSelector(selectDeviceUnavailableCapabilities);
    const addressDisplayType = useSelector(selectAddressDisplayType);

    if (ethereumStakeType || ['data', 'opreturn'].includes(type)) {
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
