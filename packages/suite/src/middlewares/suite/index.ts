import log from './logMiddleware';
import suite from './suiteMiddleware';
import redirect from './redirectMiddleware';
import analytics from './analyticsMiddleware';
import buttonRequest from './buttonRequestMiddleware';

export default [log, redirect, suite, analytics, buttonRequest];
