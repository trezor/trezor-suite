import { unecryptedJotaiStorage } from '@suite-native/storage';

const sentryPerformanceConsentKey = 'sentryPerformanceAnalyticsConfirmedAndEnabled';

let isPerformanceEnabledOnAppStart = false;

export const getPersistedSentryPerformanceConsent = () =>
    unecryptedJotaiStorage.getBoolean(sentryPerformanceConsentKey) === true;

export const setPersistedSentryPerformanceConsent = (isEnabled: boolean) => {
    unecryptedJotaiStorage.set(sentryPerformanceConsentKey, isEnabled);
};

export const setSentryPerformanceEnabledOnAppStart = (isEnabled: boolean) => {
    isPerformanceEnabledOnAppStart = isEnabled;
};

export const getSentryPerformanceEnabledOnAppStart = () => isPerformanceEnabledOnAppStart;
