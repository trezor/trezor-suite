import type { ErrorEvent, EventHint } from '@sentry/core';

import { normalizeObjectErrors } from './normalizeObjectErrors';
import { redactSentryEvent } from './redactSentryEvent';

export const commonBeforeSend = (event: ErrorEvent, hint: EventHint) =>
    normalizeObjectErrors(redactSentryEvent(event), hint);
