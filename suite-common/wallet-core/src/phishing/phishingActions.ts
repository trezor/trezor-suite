import { createAction } from '@reduxjs/toolkit';

export const PHISHING_MODULE_PREFIX = '@common/wallet-core/phishing';

const setDustPhishing = createAction(
    `${PHISHING_MODULE_PREFIX}/setDustPhishing`,
    (payload: { isEnabled: boolean; dustThreshold: string }) => ({ payload }),
);

export const phishingActions = {
    setDustPhishing,
} as const;
