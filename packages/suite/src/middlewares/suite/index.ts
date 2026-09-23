import type { MiddlewareAPI } from 'redux';

import { metadataMiddleware } from '@suite/metadata';
import { routerMiddleware } from '@suite/router';
import { tradingMiddleware } from '@suite/trading';
import { logsMiddleware } from '@suite-common/logger';
import { preparePushNotificationMiddleware } from '@suite-common/wallet-core';

import {
    type PrepareAnalyticsMiddlewareDeps,
    prepareAnalyticsMiddleware,
} from './analyticsMiddleware';
import buttonRequest from './buttonRequestMiddleware';
import events from './eventsMiddleware';
import log from './logsMiddleware';
import messageSystem from './messageSystemMiddleware';
import protocol from './protocolMiddleware';
import redirect from './redirectMiddleware';
import sentry from './sentryMiddleware';
import { type PrepareSuiteMiddlewareDeps, prepareSuiteMiddleware } from './suiteMiddleware';
import { deferMiddleware } from '../deferMiddleware';
import { type SuiteMiddlewaresDep } from '../suiteMiddlewares';

export type GetSuiteMiddlewareDeps = PrepareSuiteMiddlewareDeps &
    PrepareAnalyticsMiddlewareDeps &
    SuiteMiddlewaresDep;

export const getSuiteMiddleware = (
    getExtra: () => GetSuiteMiddlewareDeps | null,
): ((api: MiddlewareAPI<any>) => any)[] => [
    log,
    logsMiddleware, // Common logs shared between desktop and mobile app
    redirect,
    prepareSuiteMiddleware(getExtra),
    prepareAnalyticsMiddleware(getExtra),
    buttonRequest,
    deferMiddleware(() => getExtra()?.middlewares.bluetoothMiddleware),
    events,
    preparePushNotificationMiddleware(getExtra),
    metadataMiddleware,
    messageSystem,
    protocol,
    routerMiddleware(getExtra),
    tradingMiddleware(getExtra),
    sentry,
];
