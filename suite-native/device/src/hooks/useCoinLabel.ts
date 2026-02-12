import { useSelector } from 'react-redux';

import { selectHasBitcoinOnlyFirmware } from '@suite-common/device';

export const useCoinLabel = () => {
    const isBtcOnly = useSelector(selectHasBitcoinOnlyFirmware);

    return isBtcOnly ? 'bitcoin' : 'crypto';
};
