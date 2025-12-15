import { logsMiddleware } from '@suite-common/logger';
import type { ExtraDependencies } from '@suite-common/redux-utils';
import { preparePushNotificationMiddleware } from '@suite-common/wallet-core';

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

export const getSuiteMiddleware = (getExtra: () => ExtraDependencies | null) => [
    log,
    logsMiddleware, // Common logs shared between desktop and mobile app
    redirect,
    prepareSuiteMiddleware(getExtra),
    analytics,
    buttonRequest,
    events,
    preparePushNotificationMiddleware(getExtra),
    metadata,
    messageSystem,
    protocol,
    router,
    sentry,
];
