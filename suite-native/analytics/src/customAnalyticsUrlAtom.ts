import { atomWithUnecryptedStorage } from '@suite-native/storage';

export const CUSTOM_ANALYTICS_URL_KEY = 'customAnalyticsUrl';

export const customAnalyticsUrlAtom = atomWithUnecryptedStorage<string | undefined>(
    CUSTOM_ANALYTICS_URL_KEY,
    undefined,
);
