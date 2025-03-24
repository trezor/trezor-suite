import { createAction } from '@reduxjs/toolkit';

import { NetworkSymbol } from '@suite-common/wallet-config';
import type { NetworksFees } from '@suite-common/wallet-types';

export const FEES_MODULE_PREFIX = '@common/wallet-core/fees';

const updateFee = createAction(
    `${FEES_MODULE_PREFIX}/updateFee`,
    (payload: Partial<NetworksFees>) => ({
        payload,
    }),
);

const removeFee = createAction(
    `${FEES_MODULE_PREFIX}/removeFee`,
    (payload: { network: NetworkSymbol }) => ({
        payload,
    }),
);

export const feesActions = {
    updateFee,
    removeFee,
};
