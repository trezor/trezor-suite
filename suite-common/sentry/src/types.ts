import type { ErrorEvent } from '@sentry/core';

/**
 * Allows to to compose a Sentry beforeSend from smaller atomic functions, because
 * Sentry's beforeSend type can return null, but doesn't accept it.
 */
export type ChainableBeforeSend = (event: ErrorEvent | null) => ErrorEvent | null;
