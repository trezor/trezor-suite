import { createAction } from '@reduxjs/toolkit';

import { NetworkSymbol } from '@suite-common/wallet-config';
import { FeeInfo, FeesState, FeesStatus } from '@suite-common/wallet-types';

export const FEES_MODULE_PREFIX = '@common/wallet-core/fees';

const updateFee = createAction(
    `${FEES_MODULE_PREFIX}/updateFee`,
    // note: status is handled automatically by reducer cases for `updateFeeInfoThunk`
    (payload: { symbol: NetworkSymbol; data: FeeInfo; status?: FeesStatus }) => ({
        payload,
    }),
);

const updateMultipleFees = createAction(
    `${FEES_MODULE_PREFIX}/updateMultipleFees`,
    (payload: Partial<FeesState>) => ({
        payload,
    }),
);

export const feesActions = {
    updateFee,
    updateMultipleFees,
};
