import { type TransactionEvent } from '@sentry/core';
import * as Sentry from '@sentry/react-native';

const allowedNavigationMeasurementNames = new Set([
    'frames_frozen',
    'frames_slow',
    'frames_total',
    'stall_count',
    'stall_longest_time',
    'stall_total_time',
    'time_to_initial_display',
]);

type NavigationPerformanceIntegration = ReturnType<typeof Sentry.reactNavigationIntegration>;

let navigationPerformanceIntegration: NavigationPerformanceIntegration | undefined;

export const createNavigationPerformanceIntegration = (): NavigationPerformanceIntegration => {
    navigationPerformanceIntegration = Sentry.reactNavigationIntegration({
        enableTimeToInitialDisplay: true,
        ignoreEmptyBackNavigationTransactions: true,
        useDispatchedActionData: true,
    });

    return navigationPerformanceIntegration;
};

export const registerSentryNavigationContainer = (navigationContainerRef: unknown) => {
    navigationPerformanceIntegration?.registerNavigationContainer(navigationContainerRef);
};

export const sanitizeNavigationPerformanceTransaction = (
    event: TransactionEvent,
): TransactionEvent | null => {
    if (event.contexts?.trace?.op !== 'navigation') return null;

    delete event.breadcrumbs;
    delete event.extra;
    delete event.request;
    delete event.spans;
    delete event.user;

    event.tags = { navigationPerformanceReport: true };
    event.contexts = {
        app: event.contexts.app,
        device: event.contexts.device,
        os: event.contexts.os,
        trace: {
            ...event.contexts.trace,
            data: {},
        },
    };
    event.measurements = Object.fromEntries(
        Object.entries(event.measurements ?? {}).filter(([name]) =>
            allowedNavigationMeasurementNames.has(name),
        ),
    );

    return event;
};
