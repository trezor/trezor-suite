import { useSelector } from 'react-redux';

import { selectHasBitcoinOnlyFirmware } from '@suite-common/wallet-core';

export const useCoinLabel = () => {
    const isBtcOnly = useSelector(selectHasBitcoinOnlyFirmware);

    return isBtcOnly ? 'bitcoin' : 'crypto';
};
