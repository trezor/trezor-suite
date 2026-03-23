import { type PhishingRootState } from './phishingReducerTypes';

export const selectPhishingDustThreshold = (state: PhishingRootState) =>
    state.wallet.phishing.dustThreshold;
