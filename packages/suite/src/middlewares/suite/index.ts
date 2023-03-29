import { logsMiddleware } from '@suite-common/logger';

import log from './logsMiddleware';
import suite from './suiteMiddleware';
import redirect from './redirectMiddleware';
import analytics from './analyticsMiddleware';
import buttonRequest from './buttonRequestMiddleware';
import events from './eventsMiddleware';
import metadata from './metadataMiddleware';
import messageSystem from './messageSystemMiddleware';
import protocol from './protocolMiddleware';
import router from './routerMiddleware';
import sentry from './sentryMiddleware';

export default [
    log,
    logsMiddleware, // Common logs shared between desktop and mobile app
    redirect,
    suite,
    analytics,
    buttonRequest,
    events,
    metadata,
    messageSystem,
    protocol,
    router,
    sentry,
];
