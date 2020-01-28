import log from './logMiddleware';
import suite from './suiteMiddleware';
import redirect from './redirectMiddleware';
import firmware from './firmwareMiddleware';
import analytics from './analyticsMiddleware';

export default [log, redirect, suite, firmware, analytics];
