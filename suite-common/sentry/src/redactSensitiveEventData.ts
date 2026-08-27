import type { Breadcrumb, ErrorEvent } from '@sentry/core';

import { redactSensitiveDataFromString } from '@trezor/utils';

import { type ChainableBeforeSend } from './types';

// Sentry normalizes captured objects to `normalizeDepth`, so deeper walking finds nothing.
const MAX_DEPTH = 5;

const redactValue = (value: unknown, depth = 0): unknown => {
    if (typeof value === 'string') {
        return redactSensitiveDataFromString(value);
    }

    if (value === null || typeof value !== 'object' || depth === MAX_DEPTH) {
        return value;
    }

    if (Array.isArray(value)) {
        return value.map(item => redactValue(item, depth + 1));
    }

    return Object.fromEntries(
        Object.entries(value).map(([key, item]) => [key, redactValue(item, depth + 1)]),
    );
};

const redactBreadcrumb = (breadcrumb: Breadcrumb): Breadcrumb => ({
    ...breadcrumb,
    ...(breadcrumb.message === undefined
        ? {}
        : { message: redactSensitiveDataFromString(breadcrumb.message) }),
    ...(breadcrumb.data === undefined
        ? {}
        : { data: redactValue(breadcrumb.data) as Breadcrumb['data'] }),
});

export const redactSensitiveEventData: ChainableBeforeSend = event => {
    if (event === null) return null;

    return {
        ...event,
        ...(typeof event.message === 'string'
            ? { message: redactSensitiveDataFromString(event.message) }
            : {}),
        ...(event.exception === undefined
            ? {}
            : {
                  exception: {
                      ...event.exception,
                      values: event.exception.values?.map(exceptionValue =>
                          exceptionValue.value === undefined
                              ? exceptionValue
                              : {
                                    ...exceptionValue,
                                    value: redactSensitiveDataFromString(exceptionValue.value),
                                },
                      ),
                  },
              }),
        ...(event.breadcrumbs === undefined
            ? {}
            : { breadcrumbs: event.breadcrumbs.map(redactBreadcrumb) }),
        ...(event.extra === undefined
            ? {}
            : { extra: redactValue(event.extra) as ErrorEvent['extra'] }),
    };
};
