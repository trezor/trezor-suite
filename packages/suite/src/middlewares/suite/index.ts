import { logsMiddleware } from '@suite-common/logger';
import { prepareDeviceMiddleware } from '@suite-common/wallet-core';

import { extraDependencies } from 'src/support/extraDependencies';

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

const device = prepareDeviceMiddleware(extraDependencies);

export default [
    log,
    logsMiddleware, // Common logs shared between desktop and mobile app
    redirect,
    suite,
    device,
    analytics,
    buttonRequest,
    events,
    metadata,
    messageSystem,
    protocol,
    router,
    sentry,
];
