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
import { type SuiteMiddlewaresDep } from '../suiteMiddlewares';

export type GetSuiteMiddlewareExtra = PrepareSuiteMiddlewareDeps & PrepareAnalyticsMiddlewareDeps;

export type GetSuiteMiddlewareDeps = {
    getExtra: () => GetSuiteMiddlewareExtra | null;
} & SuiteMiddlewaresDep;

export const getSuiteMiddleware = (
    deps: GetSuiteMiddlewareDeps,
): ((api: MiddlewareAPI<any>) => any)[] => [
    log,
    logsMiddleware, // Common logs shared between desktop and mobile app
    redirect,
    prepareSuiteMiddleware(deps.getExtra),
    prepareAnalyticsMiddleware(deps.getExtra),
    buttonRequest,
    deps.middlewares.bluetoothMiddleware,
    events,
    preparePushNotificationMiddleware(deps.getExtra),
    metadataMiddleware,
    messageSystem,
    protocol,
    routerMiddleware(deps.getExtra),
    tradingMiddleware(deps.getExtra),
    sentry,
];
