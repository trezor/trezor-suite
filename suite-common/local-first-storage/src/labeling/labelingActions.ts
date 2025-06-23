import { createAction } from '@reduxjs/toolkit';

export const LABELING_PREFIX = '@suite/labeling';

export const setWalletLabel = createAction(
    `${LABELING_PREFIX}/set-device-label`,
    (payload: { deviceStaticSessionId: string; label: string | null }) => ({ payload }),
);

export const setAccountLabel = createAction(
    `${LABELING_PREFIX}/set-account-label`,
    (payload: { deviceStaticSessionId: string; accountKey: string; label: string | null }) => ({
        payload,
    }),
);

export const setAddressLabel = createAction(
    `${LABELING_PREFIX}/set-address-label`,
    (payload: { address: string; label: string | null }) => ({ payload }),
);

export const setOutputLabel = createAction(
    `${LABELING_PREFIX}/set-output-label`,
    (payload: { txId: string; outputIndex: number; label: string | null }) => ({ payload }),
);

export const clearAllLabels = createAction(`${LABELING_PREFIX}/clear-all-labels`);

export const labelingActions = {
    setWalletLabel,
    setAccountLabel,
    setAddressLabel,
    setOutputLabel,
    clearAllLabels,
};
