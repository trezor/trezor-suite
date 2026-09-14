import { type NetworksRootState } from '@suite-common/networks';
import { useSelector } from 'react-redux';

import { type DeviceRootState } from '@suite-common/device';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { selectSendFormReviewButtonRequestsCount } from '@suite-common/wallet-core';

export const useYieldReviewActiveStep = (networkSymbol: NetworkSymbol) => {
    const buttonRequestsCount = useSelector((state: DeviceRootState & NetworksRootState) =>
        selectSendFormReviewButtonRequestsCount(state, networkSymbol),
    );

    return Math.max(buttonRequestsCount - 1, 0);
};
