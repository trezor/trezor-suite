import { createAction } from '@reduxjs/toolkit';

import { type FeesState } from '@suite-common/wallet-types';

export const FEES_MODULE_PREFIX = '@common/wallet-core/fees';

const updateMultipleFees = createAction(
    `${FEES_MODULE_PREFIX}/updateMultipleFees`,
    (payload: Partial<FeesState>) => ({
        payload,
    }),
);

export const feesActions = { updateMultipleFees };
