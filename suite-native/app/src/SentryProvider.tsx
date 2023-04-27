import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';

import * as Sentry from '@sentry/react-native';

import { selectIsAnalyticsEnabled } from '@suite-common/analytics';
import { getEnv, isDebugEnv, isDevelopEnv, isStagingEnv } from '@suite-native/config';
import { selectIsOnboardingFinished } from '@suite-native/module-settings';

// Enforce sentry to be enabled in devs environments (dev,staging) because we want to catch all errors
const isAlwaysEnabled = isDevelopEnv() || isStagingEnv();

const initSentry = () => {
    if (!isDebugEnv()) {
        Sentry.init({
            dsn: 'https://d473f56df60c4974ae3f3ce00547c2a9@o117836.ingest.sentry.io/4504214699245568',
            // Set tracesSampleRate to 1.0 to capture 100% of transactions for performance monitoring.
            // We recommend adjusting this value in production.
            tracesSampleRate: 1.0,
            environment: getEnv(),
        });
    }
};

initSentry();

export const SentryProvider = ({ children }: { children: React.ReactNode }) => {
    const isOnboardingFinished = useSelector(selectIsOnboardingFinished);
    const isAnalyticsEnabled = useSelector(selectIsAnalyticsEnabled);

    useEffect(() => {
        if (!isAlwaysEnabled && isOnboardingFinished) {
            if (!isAnalyticsEnabled) {
                Sentry.close();
            } else {
                initSentry();
            }
        }
    }, [isOnboardingFinished, isAnalyticsEnabled]);

    return <>{children}</>;
};
