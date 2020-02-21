import log from './logMiddleware';
import suite from './suiteMiddleware';
import redirect from './redirectMiddleware';
import analytics from './analyticsMiddleware';
import buttonRequest from './buttonRequestMiddleware';
import toast from './toastMiddleware';

export default [log, redirect, suite, analytics, buttonRequest, toast];
