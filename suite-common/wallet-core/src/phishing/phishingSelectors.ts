import { type PhishingRootState } from './phishingReducerTypes';

export const selectPhishing = (state: PhishingRootState) => state.wallet.phishing;

export const selectDustPhishingThreshold = (state: PhishingRootState) =>
    state.wallet.phishing.dustPhishing.dustThreshold;

export const selectDustPhishingIsEnabled = (state: PhishingRootState) =>
    state.wallet.phishing.dustPhishing.isEnabled;

// The dust threshold that phishing detection should actually use, or undefined when dust phishing is
// disabled (passing it to isPhishingTransaction is what enables the dust value detector).
export const selectActiveDustPhishingThreshold = (state: PhishingRootState) =>
    selectDustPhishingIsEnabled(state) ? selectDustPhishingThreshold(state) : undefined;
