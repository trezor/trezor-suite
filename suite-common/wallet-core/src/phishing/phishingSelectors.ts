import { type PhishingRootState } from './phishingReducerTypes';

export const selectDustPhishingThreshold = (state: PhishingRootState) =>
    state.wallet.phishing.dustPhishing.dustThreshold;

export const selectDustPhishingIsEnabled = (state: PhishingRootState) =>
    state.wallet.phishing.dustPhishing.isEnabled;
