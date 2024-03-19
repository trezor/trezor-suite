import { selectDeviceUnavailableCapabilities } from '@suite-common/wallet-core';
import { selectAddressDisplayType, AddressDisplayOptions } from 'src/reducers/suite/suiteReducer';
import { selectSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';
import { useSelector } from './useSelector';
import { StakeType } from '@suite-common/wallet-types';
import { DisplayMode } from 'src/types/suite';

export const useDisplayMode = (ethereumStakeType?: StakeType) => {
    const account = useSelector(selectSelectedAccount);
    const unavailableCapabilities = useSelector(selectDeviceUnavailableCapabilities);
    const addressDisplayType = useSelector(selectAddressDisplayType);

    if (ethereumStakeType) {
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
