import { createAction } from '@reduxjs/toolkit';

import { LineGraphPoint } from '@suite-common/wallet-types/libDev/src';

export const actionPrefix = '@common/suite-native/wallet-graph';

type UpdateFiatRatePayload = {
    section: 'dashboard' | 'account';
    points: LineGraphPoint[];
};

const updateGraphPoints = createAction(
    `${actionPrefix}/updateGraphPoints`,
    (payload: UpdateFiatRatePayload) => ({
        payload,
    }),
);

export const graphActions = {
    updateGraphPoints,
} as const;
