import log from './logMiddleware';
import suite from './suiteMiddleware';
import redirect from './redirectMiddleware';
import analytics from './analyticsMiddleware';
import buttonRequest from './buttonRequestMiddleware';
import events from './eventsMiddleware';
import metadata from './metadataMiddleware';
import actionBlocker from './actionBlockerMiddleware';
import messageSystem from '@suite-middlewares/messageSystemMiddleware';

export default [
    log,
    redirect,
    suite,
    analytics,
    buttonRequest,
    events,
    metadata,
    actionBlocker,
    messageSystem,
];
