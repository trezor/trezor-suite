export interface PhishingState {
    dustPhishing: {
        isEnabled: boolean;
        dustThreshold: string;
    };
}

export interface PhishingRootState {
    wallet: {
        phishing: PhishingState;
    };
}
