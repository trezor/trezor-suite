import { createAction } from '@reduxjs/toolkit';

export const PHISHING_MODULE_PREFIX = '@common/wallet-core/phishing';

const setDustThreshold = createAction(
    `${PHISHING_MODULE_PREFIX}/setDustThreshold`,
    (payload: { dustThreshold?: string }) => ({ payload }),
);

export const phishingActions = {
    setDustThreshold,
} as const;
