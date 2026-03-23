export interface PhishingState {
    dustThreshold?: string;
}

export interface PhishingRootState {
    wallet: {
        phishing: PhishingState;
    };
}
