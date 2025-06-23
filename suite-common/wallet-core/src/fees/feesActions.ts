import { createAction } from '@reduxjs/toolkit';

import { NetworkSymbol } from '@suite-common/wallet-config';
import { FeeInfo, FeesState, FeesStatus } from '@suite-common/wallet-types';

export const FEES_MODULE_PREFIX = '@common/wallet-core/fees';

const updateFee = createAction(
    `${FEES_MODULE_PREFIX}/updateFee`,
    (payload: { symbol: NetworkSymbol; status: FeesStatus; data?: FeeInfo }) => ({
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
