import type { MiddlewareAPI } from 'redux';

import { metadataMiddleware } from '@suite/metadata';
import { regionsMiddleware } from '@suite/regions';
import { routerMiddleware } from '@suite/router';
import { tradingMiddleware } from '@suite/trading';
import { logsMiddleware } from '@suite-common/logger';
import { preparePushNotificationMiddleware } from '@suite-common/wallet-core';
import {
    type PrepareAnalyticsMiddlewareDeps,
    type PrepareSuiteMiddlewareDeps,
    buttonRequestMiddleware as buttonRequest,
    eventsMiddleware as events,
    logsMiddleware as log,
    messageSystemMiddleware as messageSystem,
    prepareAnalyticsMiddleware,
    prepareSuiteMiddleware,
    protocolMiddleware as protocol,
    redirectMiddleware as redirect,
    sentryMiddleware as sentry,
} from '@trezor/suite';

export type GetSuiteMiddlewareDeps = PrepareSuiteMiddlewareDeps & PrepareAnalyticsMiddlewareDeps;

export const getSuiteMiddleware = (
    getExtra: () => GetSuiteMiddlewareDeps | null,
): ((api: MiddlewareAPI<any>) => any)[] => [
    log,
    logsMiddleware, // Common logs shared between desktop and mobile app
    redirect,
    prepareSuiteMiddleware(getExtra),
    prepareAnalyticsMiddleware(getExtra),
    buttonRequest,
    events,
    preparePushNotificationMiddleware(getExtra),
    metadataMiddleware,
    messageSystem,
    protocol,
    routerMiddleware(getExtra),
    tradingMiddleware(getExtra),
    regionsMiddleware(getExtra),
    sentry,
];
