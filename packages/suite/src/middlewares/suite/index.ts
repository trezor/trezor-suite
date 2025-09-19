import { logsMiddleware } from '@suite-common/logger';

import analytics from './analyticsMiddleware';
import buttonRequest from './buttonRequestMiddleware';
import events from './eventsMiddleware';
import log from './logsMiddleware';
import messageSystem from './messageSystemMiddleware';
import metadata from './metadataMiddleware';
import protocol from './protocolMiddleware';
import redirect from './redirectMiddleware';
import router from './routerMiddleware';
import sentry from './sentryMiddleware';
import { prepareSuiteMiddleware } from './suiteMiddleware';
import { extraDependencies } from '../../support/extraDependencies';

export const suiteMiddlewares = [
    log,
    logsMiddleware, // Common logs shared between desktop and mobile app
    redirect,
    prepareSuiteMiddleware(extraDependencies),
    analytics,
    buttonRequest,
    events,
    metadata,
    messageSystem,
    protocol,
    router,
    sentry,
];
